
import React, { useState, useRef, useEffect } from 'react';
import { signUp, login, verifyEmailCode } from '../db';
import { User } from '../types';
import emailjs from 'emailjs-com';

// --- CONFIGURATION ---
const EMAIL_CONFIG = {
  SERVICE_ID: 'service_qsey67s', 
  TEMPLATE_ID: 'template_pwj9ncd', 
  PUBLIC_KEY: 'NFhRTE7qhr62rX7Qx'   
};

interface AuthViewProps {
  onAuthenticated: (user: User) => void;
}

type AuthStep = 'login' | 'signup' | 'verify';

const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated }) => {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tempOtp, setTempOtp] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (EMAIL_CONFIG.PUBLIC_KEY) {
      emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
    }
  }, []);

  useEffect(() => {
    let timer: any;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const sendEmail = async (toEmail: string, name: string, code: string) => {
    const targetEmail = toEmail.trim();
    
    if (!targetEmail) {
      throw new Error('Internal Error: Recipient email address is missing.');
    }

    if (!EMAIL_CONFIG.PUBLIC_KEY || !EMAIL_CONFIG.SERVICE_ID || !EMAIL_CONFIG.TEMPLATE_ID) {
      throw new Error('Email configuration missing in the application.');
    }

    try {
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + 15);
      const timeStr = expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const templateParams = {
        to_email: targetEmail,
        user_name: name || 'Explorer',
        otp_code: code,
        time: timeStr,
        app_name: 'SkillQuest Mastery'
      };

      const response = await emailjs.send(
        EMAIL_CONFIG.SERVICE_ID,
        EMAIL_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAIL_CONFIG.PUBLIC_KEY
      );
      
      console.log('Email successfully dispatched:', response.status, response.text);
    } catch (err: any) {
      let errorMessage = 'Unknown Email Error';
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        errorMessage = err.text || err.message || JSON.stringify(err);
      }
      console.error('Detailed EmailJS Error Object:', err);
      throw new Error(`Email System Error: ${errorMessage}`);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !tempOtp) return;
    setError('');
    setIsLoading(true);
    try {
      const targetEmail = email.trim();
      if (!targetEmail) throw new Error("Please enter your email address first.");
      
      await sendEmail(targetEmail, fullName || targetEmail.split('@')[0], tempOtp);
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedEmail = email.trim();

    try {
      if (step === 'login') {
        const user = await login(trimmedEmail, password);
        if (user) {
          onAuthenticated(user);
        } else {
          setError('Invalid login details or account not verified.');
        }
      } else if (step === 'signup') {
        if (!trimmedEmail) {
          setError('Email is required.');
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        
        const response = await signUp(trimmedEmail, password, fullName);
        setTempOtp(response.otp);
        
        try {
          await sendEmail(trimmedEmail, fullName, response.otp);
          setStep('verify');
          setResendTimer(60);
        } catch (emailErr: any) {
          setError(emailErr.message);
          setIsLoading(false);
          return;
        }
      } else if (step === 'verify') {
        const code = otpDigits.join('');
        if (code.length < 6) {
          setError('Please enter the full 6-digit code.');
          setIsLoading(false);
          return;
        }
        const user = await verifyEmailCode(trimmedEmail, code);
        if (user) {
          onAuthenticated(user);
        } else {
          setError('Invalid verification code.');
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      const msg = err.message || (typeof err === 'string' ? err : 'An authentication error occurred.');
      if (msg.includes('unique constraint')) {
        setError('This email is already in use. Try signing in instead.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-md bg-slate-900/50 backdrop-blur-2xl border border-slate-800 p-8 rounded-[32px] shadow-2xl transition-all duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg mb-4">
            {/* Updated Auth Icon to Compass */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
            {step === 'verify' ? 'Check Your Inbox' : step === 'login' ? 'Welcome Back' : 'Join SkillQuest'}
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            {step === 'verify' ? 'We sent a code to your email' : 'Start your learning journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'signup' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Your Name</label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:border-blue-500 outline-none transition-all font-medium"
                placeholder="How should we call you?"
              />
            </div>
          )}

          {step !== 'verify' && (
            <>
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:border-blue-500 outline-none transition-all font-medium"
                  placeholder="your@email.com"
                />
              </div>
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:border-blue-500 outline-none transition-all font-medium"
                  placeholder="Keep it secret"
                />
              </div>
            </>
          )}

          {step === 'signup' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:border-blue-500 outline-none transition-all font-medium"
                placeholder="One more time"
              />
            </div>
          )}

          {step === 'verify' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Enter your 6-digit code</label>
              <div className="flex justify-between gap-2 md:gap-3">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-full h-12 md:h-14 bg-slate-950/50 border border-slate-800 rounded-xl text-center text-xl font-black text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                  />
                ))}
              </div>
              <div className="mt-6 flex flex-col items-center gap-2">
                <button 
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 disabled:text-slate-600 transition-colors"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Request New Code'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 animate-shake">
              <p className="text-red-400 text-[10px] font-black uppercase text-center leading-tight whitespace-pre-wrap">
                {error}
              </p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-500/10 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-[10px]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Please wait...
              </span>
            ) : (
              step === 'login' ? 'Sign In' : 
              step === 'signup' ? 'Create Account' : 'Verify Identity'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          {step !== 'verify' ? (
            <button 
              onClick={() => {
                setStep(step === 'login' ? 'signup' : 'login');
                setError('');
              }}
              className="text-slate-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-[0.1em] transition-colors"
            >
              {step === 'login' ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          ) : (
            <button 
              onClick={() => {
                setStep('signup');
                setError('');
                setOtpDigits(['', '', '', '', '', '']);
              }}
              className="text-slate-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-[0.1em] transition-colors"
            >
              Go back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;

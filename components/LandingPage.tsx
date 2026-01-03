
import React, { useState, useEffect, useRef } from 'react';
import { COLUMNS } from '../constants';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick }) => {
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden selection:bg-blue-500/30 font-inter scroll-smooth">
      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .stagger-1 { transition-delay: 0.1s; }
        .stagger-2 { transition-delay: 0.2s; }
        .stagger-3 { transition-delay: 0.3s; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .polymath-node {
          filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
        }
      `}</style>

      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-emerald-600/5 rounded-full blur-[100px] animate-pulse [animation-delay:4s]"></div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-md border-b border-slate-900 py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">SkillQuest</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Our Method</a>
            <a href="#how-it-works" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">How it works</a>
            <a href="#science" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Why it works</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={onLoginClick}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button 
              onClick={onSignupClick}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              Join Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-8 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 animate-in fade-in slide-in-from-left-4 duration-1000">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Master new skills with AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl xl:text-8xl font-black tracking-tighter mb-8 leading-[0.9] uppercase italic animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
              Master any skill,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">one step at a time.</span>
            </h1>
            
            <p className="max-w-2xl mx-auto lg:mx-0 text-lg md:text-xl text-slate-400 font-medium mb-12 animate-in fade-in slide-in-from-left-12 duration-1000 delay-300">
              Stop starting over. SkillQuest helps you build a clear path from beginner to pro, using AI to make sure your new skills actually stick.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 animate-in fade-in slide-in-from-left-16 duration-1000 delay-500">
              <button 
                onClick={onSignupClick}
                className="group relative bg-white text-slate-950 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-blue-50 transition-all active:scale-95"
              >
                Start Your Journey
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
              </button>
              <a 
                href="#features"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black uppercase tracking-widest text-xs"
              >
                Learn our method
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </a>
            </div>
          </div>

          <div className="flex-1 w-full flex justify-center items-center animate-in fade-in zoom-in duration-1000 delay-700">
            <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
              
              <svg viewBox="0 0 500 500" className="w-full h-full animate-float relative z-10">
                <circle cx="250" cy="250" r="60" fill="url(#coreGradient)" className="polymath-node" />
                <path d="M250 215L285 250L250 285L215 250Z" fill="white" className="animate-pulse" />
                
                <g stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" strokeDasharray="5 5">
                  <line x1="250" y1="250" x2="100" y2="100" />
                  <line x1="250" y1="250" x2="400" y2="100" />
                  <line x1="250" y1="250" x2="100" y2="400" />
                  <line x1="250" y1="250" x2="400" y2="400" />
                  <line x1="250" y1="250" x2="250" y2="50" />
                  <line x1="250" y1="250" x2="450" y2="250" />
                </g>

                <g className="polymath-node">
                  <circle cx="100" cy="100" r="35" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                  <text x="82" y="108" fill="#3b82f6" fontSize="24">{'< >'}</text>
                  
                  <circle cx="400" cy="100" r="35" fill="#1e293b" stroke="#a855f7" strokeWidth="2" />
                  <path d="M385 105L415 105M390 95L410 95" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
                  
                  <circle cx="100" cy="400" r="35" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                  <path d="M90 415V390L115 385V410" stroke="#f59e0b" strokeWidth="3" fill="none" />
                  
                  <circle cx="400" cy="400" r="35" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                  <circle cx="400" cy="400" r="15" stroke="#10b981" strokeWidth="2" fill="none" />
                  <circle cx="400" cy="400" r="5" fill="#10b981" />
                </g>

                <defs>
                  <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute w-[80%] h-[80%] border border-white/5 rounded-full animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute w-[110%] h-[110%] border border-white/5 rounded-full animate-[spin_30s_linear_infinite_reverse]"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 reveal">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">How you'll master skills</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-bold uppercase tracking-widest text-xs">Four simple steps to real progress</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { step: '01', title: 'Choose a skill', desc: 'Pick anything you want to learn. Coding, cooking, or a new language.', icon: '🎯' },
              { step: '02', title: 'Get your plan', desc: 'Our AI creates a step-by-step roadmap tailored to your current level.', icon: '🏗️' },
              { step: '03', title: 'Stay on track', desc: 'Complete daily habits that turn effort into second nature.', icon: '⚡' },
              { step: '04', title: 'Level up', desc: 'Unlock new challenges as you master the basics and reach the top.', icon: '🚀' },
            ].map((item, i) => (
              <div key={i} className={`reveal stagger-${i+1} relative p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition-all group overflow-hidden`}>
                <div className="absolute -right-4 -top-4 text-8xl font-black text-white/[0.03] italic group-hover:text-blue-500/5 transition-colors">{item.step}</div>
                <div className="text-4xl mb-6">{item.icon}</div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mastery Levels Section */}
      <section id="features" className="py-20 md:py-32 px-6 bg-slate-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 reveal">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">Your path to mastery</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-bold uppercase tracking-widest text-xs">A structured way to grow from beginner to pro</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COLUMNS.map((col, idx) => (
              <div 
                key={col.id} 
                className={`reveal stagger-${idx+1} p-8 rounded-[32px] border bg-slate-900/40 backdrop-blur-sm transition-all hover:-translate-y-2 group ${col.color}`}
              >
                <div className="mb-6 p-4 rounded-2xl bg-white/5 inline-block group-hover:scale-110 transition-transform">
                  {col.icon}
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter mb-3">{col.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {col.description}
                </p>
                <div className="pt-6 border-t border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Stage {idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Science & Numbers Section */}
      <section id="science" className="py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 reveal">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight mb-8">
              Why it actually <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">works for you.</span>
            </h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed mb-8">
              SkillQuest is designed for how the human brain actually learns. We focus on small, consistent wins that build lasting habits instead of quick bursts that fade away.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-4xl font-black text-white mb-1 tracking-tighter">2.5X</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Better Memory Retention</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white mb-1 tracking-tighter">74%</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">More Likely to Stick</div>
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 gap-4 reveal stagger-2">
            {[
              { title: 'Habit Building', text: 'Daily small tasks help your skills become part of your daily routine.' },
              { title: 'AI Coaching', text: 'Get personalized feedback and plans as you move through each level.' },
              { title: 'Visual Progress', text: 'Watch your progress bars grow as you move closer to total mastery.' }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-black uppercase italic tracking-tight text-white mb-1">{feature.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Roadmap Spotlight */}
      <section id="ai" className="py-20 md:py-32 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 order-2 md:order-1 reveal">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M12 7v5l3 3"/></svg>
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-100">AI Mentor</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Preparing your lesson</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-2">Request</div>
                    <div className="text-xs font-semibold text-blue-400">"Create a beginner path for learning Chess..."</div>
                  </div>
                  <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                       <div className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Plan Ready</div>
                       <div className="text-[8px] font-black text-slate-700">Ready</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-slate-800 rounded"></div>
                      <div className="h-1.5 w-full bg-slate-800 rounded"></div>
                      <div className="h-1.5 w-2/3 bg-slate-800 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 order-1 md:order-2 reveal stagger-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Personalized Learning</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight mb-8">
              A clear path <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">for every goal.</span>
            </h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed mb-8">
              Most people quit because they don't know what to do next. SkillQuest uses AI to break down big goals into simple daily tasks you can actually finish.
            </p>
            <button 
              onClick={onSignupClick}
              className="text-xs font-black uppercase tracking-[0.2em] px-8 py-4 rounded-xl border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-white"
            >
              Build My Path
            </button>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20 md:py-48 px-6 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 reveal">
          <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter mb-10 leading-[0.8]">
            Ready to master <br/>
            <span className="text-slate-500">something new?</span>
          </h2>
          <p className="text-slate-400 mb-12 text-lg font-medium">Join 5,000+ others who are reaching their goals with SkillQuest.</p>
          <button 
            onClick={onSignupClick}
            className="group relative bg-gradient-to-br from-blue-500 to-purple-600 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-blue-500/30 hover:scale-105 transition-all active:scale-95"
          >
            Start Learning for Free
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl"></div>
          </button>
          
          <div className="mt-32 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-slate-900 pt-10">
            <div className="flex items-center gap-2">
              <div className="bg-slate-800 p-1.5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              </div>
              <span className="text-sm font-black tracking-tighter uppercase italic opacity-50">SkillQuest © 2025</span>
            </div>
            
            <div className="flex items-center gap-8">
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Support</a>
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

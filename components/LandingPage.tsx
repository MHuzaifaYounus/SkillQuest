
import React, { useState, useEffect } from 'react';
import { COLUMNS } from '../constants';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick }) => {
  const [scrolled, setScrolled] = useState(false);

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
    <div className="min-h-screen bg-[#02040a] text-slate-50 overflow-x-hidden selection:bg-blue-500/30 font-inter scroll-smooth">
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
        .stagger-4 { transition-delay: 0.4s; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .gradient-text {
          background: linear-gradient(to right, #60a5fa, #a855f7, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${scrolled ? 'bg-[#02040a]/80 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">SkillQuest</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-10">
            <a href="#features" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Our Method</a>
            <a href="#how-it-works" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">How it works</a>
            <a href="#why-us" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Why it works</a>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={onLoginClick} className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white px-4">Sign In</button>
            <button onClick={onSignupClick} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-lg transition-all active:scale-95 shadow-xl shadow-blue-500/20">Join Free</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-24 lg:pt-0 overflow-hidden px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full relative z-10">
          <div className="reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Master new skills with AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9] uppercase italic">
              Master any skill, <br/>
              <span className="gradient-text">one step at a time.</span>
            </h1>
            
            <p className="text-sm md:text-base text-slate-400 font-medium mb-10 max-w-lg leading-relaxed">
              Stop starting over. SkillQuest helps you build a clear path from beginner to pro, using AI to make sure your new skills actually stick.
            </p>
            
            <div className="flex flex-wrap items-center gap-6">
              <button onClick={onSignupClick} className="bg-white text-black px-8 py-4 rounded-xl font-black uppercase tracking-[0.15em] text-[11px] hover:bg-slate-200 transition-all active:scale-95 shadow-2xl">
                Start Your Journey
              </button>
              <a href="#features" className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 hover:text-white flex items-center gap-2">
                Learn our method
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </a>
            </div>
          </div>

          <div className="relative flex justify-center items-center reveal stagger-2">
            <div className="relative w-full aspect-square max-w-[500px] animate-float">
               {/* UI Graphic mock-up from the design */}
               <div className="absolute inset-0 bg-blue-600/10 rounded-full blur-[80px]"></div>
               <svg viewBox="0 0 500 500" className="w-full h-full relative z-10">
                  <circle cx="250" cy="250" r="140" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="10 10" className="opacity-10" />
                  <circle cx="250" cy="250" r="190" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="5 5" className="opacity-5" />
                  
                  {/* Central Node */}
                  <rect x="210" y="210" width="80" height="80" rx="20" fill="url(#heroGrad)" transform="rotate(45 250 250)" className="shadow-2xl" />
                  <svg x="235" y="235" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>

                  {/* Satellite Nodes */}
                  <circle cx="120" cy="120" r="25" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                  <text x="110" y="125" fill="#3b82f6" fontSize="12" fontWeight="900" transform="rotate(-5 120 120)">&lt;/&gt;</text>

                  <circle cx="380" cy="120" r="25" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
                  <path d="M370 120h20m-20 8h20" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />

                  <circle cx="120" cy="380" r="25" fill="#0f172a" stroke="#eab308" strokeWidth="2" />
                  <rect x="110" y="370" width="20" height="20" rx="4" stroke="#eab308" strokeWidth="2.5" fill="none" />

                  <circle cx="380" cy="380" r="25" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                  <circle cx="380" cy="380" r="8" stroke="#10b981" strokeWidth="2.5" />

                  <defs>
                    <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#9333ea" />
                    </linearGradient>
                  </defs>
               </svg>
            </div>
          </div>
        </div>
      </section>

      {/* How You'll Master Skills */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center mb-16 reveal">
          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">How you'll master skills</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Four simple steps to real progress</p>
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: '01', title: 'Choose a skill', desc: 'Pick anything you want to learn. Coding, cooking, or a new language.', icon: '🎯' },
            { id: '02', title: 'Get your plan', desc: 'Our AI creates a step-by-step roadmap tailored to your current level.', icon: '🏗️' },
            { id: '03', title: 'Stay on track', desc: 'Complete daily habits that turn effort into second nature.', icon: '⚡' },
            { id: '04', title: 'Level up', desc: 'Unlock new challenges as you master the basics and reach the top.', icon: '🚀' }
          ].map((item, i) => (
            <div key={i} className={`reveal stagger-${i+1} relative group bg-[#0a0f1d] border border-white/5 p-8 rounded-[32px] overflow-hidden`}>
              <div className="absolute right-0 top-0 text-9xl font-black text-white/[0.03] italic -mr-4 -mt-8 select-none">{item.id}</div>
              <div className="text-4xl mb-6 relative z-10">{item.icon}</div>
              <h3 className="text-xl font-black uppercase italic mb-3 relative z-10">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed relative z-10">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Your Path to Mastery */}
      <section id="features" className="py-24 px-6 bg-[#040812]">
        <div className="max-w-7xl mx-auto text-center mb-16 reveal">
          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">Your path to mastery</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">A structured way to grow from beginner to pro</p>
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COLUMNS.map((col, i) => (
            <div key={i} className={`reveal stagger-${i+1} p-8 rounded-[32px] border bg-slate-900/20 backdrop-blur-xl group transition-all duration-500 hover:scale-[1.02] ${col.color}`}>
              <div className="mb-10 p-4 rounded-2xl bg-white/5 inline-block group-hover:scale-110 transition-transform">
                {col.icon}
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter mb-3">{col.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-8">{col.description}</p>
              <div className="pt-6 border-t border-white/5 text-[9px] font-black uppercase tracking-widest opacity-40">
                Stage {i + 1}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why it Actually Works For You */}
      <section id="why-us" className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="reveal">
            <h2 className="text-5xl md:text-6xl font-black italic uppercase leading-[0.9] mb-10">
              Why it actually <br/>
              <span className="text-blue-500">works for you.</span>
            </h2>
            <p className="text-base text-slate-400 mb-12 max-w-md leading-relaxed font-medium">
              SkillQuest is designed for how the human brain actually learns. We focus on small, consistent wins that build lasting habits instead of quick bursts that fade away.
            </p>
            
            <div className="grid grid-cols-2 gap-10 border-t border-white/5 pt-10">
              <div>
                <div className="text-4xl font-black text-white italic mb-1">2.5X</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Better memory retention</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white italic mb-1">74%</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">More likely to stick</div>
              </div>
            </div>
          </div>

          <div className="space-y-6 reveal stagger-2">
            {[
              { title: 'Habit Building', desc: 'Daily small tasks help your skills become part of your daily routine.', icon: '🔹' },
              { title: 'AI Coaching', desc: 'Get personalized feedback and plans as you move through each level.', icon: '🔹' },
              { title: 'Visual Progress', desc: 'Watch your progress bars grow as you move closer to total mastery.', icon: '🔹' }
            ].map((f, i) => (
              <div key={i} className="flex gap-6 p-6 rounded-[24px] bg-[#0a0f1d] border border-white/5 group hover:border-blue-500/20 transition-all">
                <div className="text-blue-500 mt-1">{f.icon}</div>
                <div>
                  <h4 className="text-sm font-black uppercase italic tracking-tighter mb-1 text-white">{f.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* A Clear Path for Every Goal */}
      <section className="py-24 px-6 bg-[#02040a] relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 reveal">
             <div className="relative bg-[#050811] rounded-2xl border border-white/10 shadow-2xl p-6 md:p-10 font-mono">
               <div className="flex gap-2 mb-6">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
               </div>
               
               <div className="space-y-6">
                 <div className="flex items-start gap-4">
                   <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                     <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20"/><path d="m5 15 7-7 7 7"/></svg>
                   </div>
                   <div>
                     <div className="text-[10px] text-blue-500 font-black uppercase mb-1">AI Mentor</div>
                     <div className="text-xs text-slate-400">Preparing your lesson...</div>
                   </div>
                 </div>

                 <div className="bg-[#0c1326] p-4 rounded-xl border border-white/5">
                   <div className="text-[9px] text-slate-600 font-black uppercase mb-2">Request</div>
                   <div className="text-xs text-blue-400 font-bold">"Create a beginner path for learning Chess..."</div>
                 </div>

                 <div className="space-y-3">
                   <div className="flex justify-between items-center">
                     <div className="text-[9px] text-slate-600 font-black uppercase">Plan Ready</div>
                     <div className="text-[9px] text-emerald-500 font-black uppercase">Ready</div>
                   </div>
                   <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full w-4/5 bg-blue-500"></div>
                   </div>
                   <div className="h-1 bg-slate-800 rounded-full w-3/4"></div>
                   <div className="h-1 bg-slate-800 rounded-full w-1/2"></div>
                 </div>
               </div>
             </div>
          </div>

          <div className="order-1 lg:order-2 reveal stagger-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
              <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Personalized Learning</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black italic uppercase leading-[0.9] mb-8">
              A clear path <br/>
              <span className="text-emerald-500">for every goal.</span>
            </h2>
            <p className="text-base text-slate-400 mb-10 max-w-md leading-relaxed font-medium">
              Most people quit because they don't know what to do next. SkillQuest uses AI to break down big goals into simple daily tasks you can actually finish.
            </p>
            <button onClick={onSignupClick} className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-slate-200 transition-all active:scale-95 shadow-2xl">
              Build My Path
            </button>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 px-6 text-center reveal">
        <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter mb-10 leading-[0.8]">
          Ready to master <br/>
          <span className="text-slate-700">something new?</span>
        </h2>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-12">
          Join 5,000+ others who are reaching their goals with SkillQuest.
        </p>
        <button 
          onClick={onSignupClick}
          className="group relative inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl transition-all hover:scale-105 active:scale-95 overflow-hidden"
        >
          <span className="relative z-10">Start learning for free</span>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
        </button>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            <span className="text-[10px] font-black tracking-widest uppercase italic text-slate-500">SkillQuest © 2025</span>
          </div>
          
          <div className="flex items-center gap-10">
            <a href="#" className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Support</a>
            <a href="#" className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

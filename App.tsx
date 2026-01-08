
import React, { useState, useEffect, useCallback } from 'react';
import { Skill, SkillLevel, User } from './types';
import { COLUMNS } from './constants';
import Column from './components/Column';
import NotebookModal from './components/NotebookModal';
import AuthView from './components/AuthView';
import LandingPage from './components/LandingPage';
import { initDb, fetchUserSkills, upsertSkill, removeSkill } from './db';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialFetch, setIsInitialFetch] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [draggedSkill, setDraggedSkill] = useState<Skill | null>(null);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Initialize DB and Check Session
  useEffect(() => {
    const bootstrap = async () => {
      // Small artificial delay for aesthetics of the "Starting" screen
      const start = Date.now();
      await initDb();
      const savedUser = localStorage.getItem('skillquest-session');
      
      const elapsed = Date.now() - start;
      const minLoaderTime = 1500;
      if (elapsed < minLoaderTime) {
        await new Promise(r => setTimeout(r, minLoaderTime - elapsed));
      }

      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        setIsInitialFetch(true);
        setIsLoading(false);
        const data = await fetchUserSkills(u.id);
        setSkills(data);
        setIsInitialFetch(false);
      } else {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const handleAuthenticated = async (u: User) => {
    localStorage.setItem('skillquest-session', JSON.stringify(u));
    setUser(u);
    setShowAuth(false);
    setIsInitialFetch(true);
    const data = await fetchUserSkills(u.id);
    setSkills(data);
    setIsInitialFetch(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('skillquest-session');
    setUser(null);
    setSkills([]);
    setShowAuth(false);
  };

  const addSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !user) return;

    const skillId = crypto.randomUUID();
    const name = newSkillName.trim();

    const newSkill: Skill = {
      id: skillId,
      user_id: user.id,
      name,
      level: SkillLevel.DAILY,
      createdAt: Date.now(),
      notes: '',
      icon: '✨',
      checklist: []
    };

    setSkills(prev => [newSkill, ...prev]);
    setNewSkillName('');
    setIsSyncing(true);
    await upsertSkill(user.id, newSkill);
    setIsSyncing(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Assign a single relevant emoji icon for a skill named "${name}". Return only the emoji.`,
        config: { temperature: 0.5 }
      });
      
      const icon = response?.text?.trim()?.split(' ')[0] || '🎯';
      const updatedSkill = { ...newSkill, icon };
      setSkills(prev => prev.map(s => s.id === skillId ? updatedSkill : s));
      await upsertSkill(user.id, updatedSkill);
    } catch (err) {
      console.warn("Failed to auto-assign icon:", err);
    }
  };

  const deleteSkill = useCallback(async (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    await removeSkill(id);
  }, []);

  const updateSkill = useCallback(async (id: string, updates: Partial<Skill>) => {
    if (!user) return;
    setSkills(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      const target = updated.find(s => s.id === id);
      if (target) {
        setIsSyncing(true);
        upsertSkill(user.id, target).finally(() => setIsSyncing(false));
      }
      return updated;
    });
  }, [user]);

  const handleDragStart = (e: React.DragEvent, skill: Skill) => {
    setDraggedSkill(skill);
    e.dataTransfer.setData('text/plain', skill.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, level: SkillLevel) => {
    e.preventDefault();
    if (!draggedSkill || !user) return;

    const updatedSkill = { ...draggedSkill, level };
    setSkills(prev => prev.map(s => s.id === draggedSkill.id ? updatedSkill : s));
    await upsertSkill(user.id, updatedSkill);
    setDraggedSkill(null);
  };

  // Initial App Startup Loader
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-8 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-blue-500/5 rounded-full animate-[spin_20s_linear_infinite]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-2xl shadow-blue-500/20 mb-6 md:mb-8 animate-bounce">
            {/* Updated Loader Icon to Compass */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 md:w-12 md:h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase mb-2 text-center px-4">Syncing Mastery...</h2>
          <div className="flex items-center gap-2">
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Personalizing Board</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated View
  if (!user) {
    return (
      <>
        <LandingPage 
          onLoginClick={() => { setAuthMode('login'); setShowAuth(true); }}
          onSignupClick={() => { setAuthMode('signup'); setShowAuth(true); }}
        />
        {showAuth && (
          <div className="fixed inset-0 z-[100] animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAuth(false)}></div>
            <div className="relative z-10 h-full w-full">
               <AuthView onAuthenticated={handleAuthenticated} />
               <button 
                onClick={() => setShowAuth(false)}
                className="fixed top-4 right-4 md:top-6 md:right-6 z-[110] p-2.5 md:p-3 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-all active:scale-90"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
               </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Authenticated View
  const activeSkill = skills.find(s => s.id === activeSkillId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50 selection:bg-blue-500/30 app-wrapper">
      {/* Header */}
      <header className="px-4 md:px-8 py-3 md:py-5 flex items-center justify-between border-b border-slate-900 bg-slate-950/90 backdrop-blur-md sticky top-0 z-20 gap-2">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 md:p-2 rounded-lg shadow-lg shadow-blue-500/10">
            {/* Updated App Header Icon to Compass */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-black tracking-tight uppercase italic truncate max-w-[100px] sm:max-w-none">
              SkillQuest
            </h1>
            {(isSyncing || isInitialFetch) && (
              <div className="flex gap-0.5 items-center mt-0.5">
                 <div className="w-0.5 h-0.5 md:w-1 md:h-1 bg-blue-500 rounded-full animate-pulse"></div>
                 <div className="w-0.5 h-0.5 md:w-1 md:h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-6 shrink-0">
          <div className="hidden sm:flex gap-4 items-center mr-2 md:mr-4">
             <div className="flex flex-col items-end">
               <span className="text-[8px] text-slate-600 font-black uppercase">Skills</span>
               <span className="text-xs font-black text-slate-200">{skills.length}</span>
             </div>
             <div className="w-px h-6 bg-slate-800 self-center"></div>
             <div className="flex flex-col items-end">
               <span className="text-[8px] text-slate-600 font-black uppercase">Daily</span>
               <span className="text-xs font-black text-blue-400">{skills.filter(s => s.level === SkillLevel.DAILY).length}</span>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-[8px] md:text-[10px] font-black uppercase text-slate-500 hover:text-red-400 transition-colors tracking-widest border border-slate-800 px-2 md:px-3 py-1.5 rounded-lg active:scale-95"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="flex-1 p-3 md:p-8 board-container mb-24 md:mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 h-full">
          {COLUMNS.map(column => (
            <Column 
              key={column.id} 
              column={column} 
              skills={skills.filter(s => s.level === column.id)}
              isLoading={isInitialFetch}
              onDeleteSkill={deleteSkill}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onSkillClick={(skill) => setActiveSkillId(skill.id)}
            />
          ))}
        </div>
      </main>

      {/* Notebook Modal Overlay */}
      {activeSkill && (
        <NotebookModal 
          skill={activeSkill}
          onClose={() => setActiveSkillId(null)}
          onUpdate={updateSkill}
        />
      )}

      {/* Input Bar (Bottom Sticky) */}
      <footer className="fixed bottom-0 left-0 right-0 p-3 md:p-8 pointer-events-none z-30 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-8">
        <div className="max-w-xl mx-auto pointer-events-auto">
          <form 
            onSubmit={addSkill}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl md:rounded-2xl blur opacity-10 group-focus-within:opacity-40 transition duration-500"></div>
            
            <div className="relative flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-800/50 rounded-xl md:rounded-2xl p-1 md:p-1.5 shadow-2xl">
              <div className="flex-1 flex items-center px-3 md:px-4">
                <input 
                  type="text" 
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="What's next?"
                  className="w-full bg-transparent border-none text-slate-100 placeholder:text-slate-700 focus:ring-0 outline-none text-[13px] md:text-sm py-2.5 md:py-3.5 font-bold"
                />
              </div>
              <button 
                type="submit"
                disabled={!newSkillName.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black py-2 md:py-2.5 px-4 md:px-6 rounded-lg md:rounded-xl transition-all shadow-lg active:scale-95 text-[9px] md:text-[11px] uppercase tracking-widest whitespace-nowrap"
              >
                Start
              </button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default App;

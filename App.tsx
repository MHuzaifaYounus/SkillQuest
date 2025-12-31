
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [draggedSkill, setDraggedSkill] = useState<Skill | null>(null);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Initialize DB and Check Session
  useEffect(() => {
    const bootstrap = async () => {
      await initDb();
      const savedUser = localStorage.getItem('skillquest-session');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        const data = await fetchUserSkills(u.id);
        setSkills(data);
      }
      setIsLoading(false);
    };
    bootstrap();
  }, []);

  const handleAuthenticated = async (u: User) => {
    localStorage.setItem('skillquest-session', JSON.stringify(u));
    setUser(u);
    setShowAuth(false);
    const data = await fetchUserSkills(u.id);
    setSkills(data);
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
      const apiKey = process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Assign a single relevant emoji icon for a skill named "${name}". Return only the emoji.`,
        config: { temperature: 0.5 }
      });
      const icon = response.text?.trim().split(' ')[0] || '🎯';
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

  if (isLoading) return null;

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
                className="fixed top-6 right-6 z-[110] p-3 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-all"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
      <header className="px-4 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              SkillQuest
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-[8px] uppercase tracking-[0.2em] font-black text-slate-500 hidden xs:block">{user.email}</p>
              {isSyncing && (
                <div className="flex gap-0.5 items-center">
                   <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                   <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={handleLogout}
            className="text-[10px] font-black uppercase text-slate-600 hover:text-red-400 transition-colors tracking-widest border border-slate-800 px-3 py-1.5 rounded-lg"
          >
            Logout
          </button>
          <div className="hidden sm:flex gap-2 md:gap-4 items-center">
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-600 font-black uppercase">Active</span>
               <span className="text-xs md:text-sm font-black text-slate-200">{skills.length}</span>
             </div>
             <div className="w-px h-6 md:h-8 bg-slate-800 self-center"></div>
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-600 font-black uppercase">Beginner</span>
               <span className="text-xs md:text-sm font-black text-blue-400">{skills.filter(s => s.level === SkillLevel.DAILY).length}</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="flex-1 p-4 md:p-8 board-container mb-24 md:mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 h-full">
          {COLUMNS.map(column => (
            <Column 
              key={column.id} 
              column={column} 
              skills={skills.filter(s => s.level === column.id)}
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
      <footer className="fixed bottom-0 left-0 right-0 p-4 md:p-8 pointer-events-none z-30 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-8">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <form 
            onSubmit={addSkill}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl md:rounded-2xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
            
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl p-1 md:p-1.5 shadow-2xl">
              <div className="flex-1 flex items-center px-3 md:px-4">
                <svg className="text-slate-600 mr-2 md:mr-4 transition-colors group-focus-within:text-blue-400 w-4 h-4 md:w-5 md:h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                <input 
                  type="text" 
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="New Skill Protocol..."
                  className="w-full bg-transparent border-none text-slate-100 placeholder:text-slate-700 focus:ring-0 outline-none text-sm py-2.5 md:py-3 font-semibold"
                />
              </div>
              <button 
                type="submit"
                disabled={!newSkillName.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-2 md:py-2.5 px-4 md:px-6 rounded-lg md:rounded-xl transition-all shadow-lg active:scale-95 text-[10px] md:text-sm uppercase tracking-widest"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default App;

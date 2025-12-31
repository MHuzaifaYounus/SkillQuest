
import React, { useState, useEffect, useRef } from 'react';
import { Skill, ChecklistItem, SkillLevel } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NotebookModalProps {
  skill: Skill;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Skill>) => void;
}

const getNextLevel = (current: SkillLevel): SkillLevel | null => {
  switch (current) {
    case SkillLevel.DAILY: return SkillLevel.WEEKLY;
    case SkillLevel.WEEKLY: return SkillLevel.MONTHLY;
    case SkillLevel.MONTHLY: return SkillLevel.PASSIVE;
    default: return null;
  }
};

const getLevelDisplay = (level: SkillLevel) => {
  switch (level) {
    case SkillLevel.DAILY: return "Beginner - Daily";
    case SkillLevel.WEEKLY: return "Intermediate - Weekly";
    case SkillLevel.MONTHLY: return "Advanced - Monthly";
    case SkillLevel.PASSIVE: return "Master - Passive";
    default: return level;
  }
};

const NotebookModal: React.FC<NotebookModalProps> = ({ skill, onClose, onUpdate }) => {
  const [content, setContent] = useState(skill.notes || '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(skill.checklist || []);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'checklist'>(content ? 'preview' : 'checklist');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const notesChanged = content !== skill.notes;
      const checklistChanged = JSON.stringify(checklist) !== JSON.stringify(skill.checklist);
      if (notesChanged || checklistChanged) {
        setIsSaving(true);
        onUpdate(skill.id, { notes: content, checklist: checklist });
        setTimeout(() => setIsSaving(false), 800);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, checklist, skill.id, skill.notes, skill.checklist, onUpdate]);

  const toggleChecklistItem = (id: string) => {
    const updatedChecklist = checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updatedChecklist);
    
    if (updatedChecklist.length > 0 && updatedChecklist.every(i => i.completed)) {
      const nextLevel = getNextLevel(skill.level);
      if (nextLevel) {
        handleLevelUp(nextLevel);
      }
    }
  };

  const handleLevelUp = async (nextLevel: SkillLevel) => {
    setShowLevelUp(true);
    onUpdate(skill.id, { level: nextLevel });
    await performAiGeneration(nextLevel, true);
    setTimeout(() => setShowLevelUp(false), 3000);
  };

  const performAiGeneration = async (targetLevel: SkillLevel, isLevelUpAuto: boolean = false) => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const apiKey = process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
      
      let levelSpecificInstructions = "";
      let checklistConstraint = "";

      switch(targetLevel) {
        case SkillLevel.DAILY:
          levelSpecificInstructions = "You are designing a BEGINNER'S KICKSTART. Focus on high-frequency habit building. Create a roadmap that breaks down the first 7 days of practice.";
          checklistConstraint = "The checklist MUST be formatted as 'Day 1: [Task]', 'Day 2: [Task]', up to 'Day 7: [Task]'. Each task must be a simple daily habit drill.";
          break;
        case SkillLevel.WEEKLY:
          levelSpecificInstructions = "You are designing an INTERMEDIATE WEEKLY SPHERE. Focus on complexity and project-based learning. Create a 4-week progression roadmap.";
          checklistConstraint = "The checklist MUST be formatted as 'Week 1: [Milestone]', up to 'Week 4: [Milestone]'. Each task must represent a deep-dive session or a complex sub-skill.";
          break;
        case SkillLevel.MONTHLY:
          levelSpecificInstructions = "You are designing an ADVANCED MASTERY audit. Focus on theoretical deep dives and advanced performance optimization.";
          checklistConstraint = "The checklist must be 3-5 high-level 'Mastery Audits' or major milestones that require significant time to cross off.";
          break;
        case SkillLevel.PASSIVE:
          levelSpecificInstructions = "You are designing a MASTER'S RETENTION STRATEGY. Focus on preventing skill decay through minimal effort 'Keep-Alive' triggers.";
          checklistConstraint = "The checklist should consist of 3-5 'Maintenance Triggers' (e.g., 'Bi-Monthly Review', 'Subconscious Recall Drill'). These are tasks intended to stay valid long-term.";
          break;
      }

      const userContext = aiPrompt.trim() ? `Additional user context: "${aiPrompt}".` : "Generate a standard professional growth plan.";
      const prompt = `Skill: ${skill.name}. Tier: ${getLevelDisplay(targetLevel)}.
      
      MISSION:
      ${levelSpecificInstructions}
      
      CONSTRAINT:
      ${checklistConstraint}
      
      CONTEXT:
      ${userContext}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: `You are an elite skill acquisition architect with expertise in neural habit formation.
          Respond ONLY in JSON format.
          
          JSON Structure:
          {
            "notes": "A highly detailed professional markdown roadmap including objectives and philosophy.",
            "icon": "One single relevant emoji",
            "checklist": [
              { "title": "Day X: Task Title", "description": "Short specific instructions" }
            ]
          }
          
          CRITICAL: Adhere strictly to the requested checklist format (e.g., Day 1, Week 1, etc.) as specified in the MISSION instructions.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              notes: { type: Type.STRING },
              icon: { type: Type.STRING },
              checklist: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { 
                    title: { type: Type.STRING }, 
                    description: { type: Type.STRING } 
                  }, 
                  required: ["title", "description"] 
                } 
              }
            },
            required: ["notes", "icon", "checklist"]
          }
        }
      });
      
      const responseText = response.text;
      if (!responseText) throw new Error("Empty AI response");

      const data = JSON.parse(responseText);
      const newItems: ChecklistItem[] = data.checklist.map((item: any) => ({ 
        id: crypto.randomUUID(), 
        text: item.title, 
        description: item.description, 
        completed: false 
      }));
      
      const prefix = isLevelUpAuto ? `## 🚀 Tier Ascended: ${getLevelDisplay(targetLevel).toUpperCase()}\n\n` : "";
      const newNotes = prefix + data.notes;
      
      setContent(newNotes);
      setChecklist(newItems);
      onUpdate(skill.id, { 
        notes: newNotes, 
        icon: data.icon, 
        checklist: newItems,
        level: targetLevel 
      });
      setAiPrompt('');
      setViewMode('checklist');
    } catch (error) { 
      console.error("AI Generation Error:", error); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleManualAiGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    performAiGeneration(skill.level);
  };

  const progressPercent = checklist.length > 0 ? Math.round((checklist.filter(i => i.completed).length / checklist.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full md:max-w-4xl bg-slate-900 border-t md:border border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col h-[95vh] md:h-[85vh] overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 duration-500">
        
        {/* Header */}
        <div className="px-4 md:px-8 py-3 md:py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 sticky top-0 z-10">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <div className={`p-2 md:p-2.5 rounded-xl md:rounded-2xl text-xl md:text-2xl flex items-center justify-center shrink-0 w-10 h-10 md:w-12 md:h-12 transition-all ${showLevelUp ? 'bg-amber-400 text-slate-900 shadow-xl' : 'bg-blue-500/10 text-blue-400'}`}>
              {skill.icon || '🎯'}
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-black text-white truncate">{skill.name}</h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] md:text-[10px] px-1.5 py-0.5 rounded font-black uppercase bg-blue-500/10 text-blue-400">{getLevelDisplay(skill.level)}</span>
                <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter hidden xs:block">{isSaving ? 'Syncing...' : 'Encrypted'}</span>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 md:px-8 py-2 bg-slate-950/20 border-b border-slate-800 overflow-x-auto">
          <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800/50 min-w-max">
            {['edit', 'preview', 'checklist'].map((mode) => (
              <button 
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`flex-1 px-4 md:px-6 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {mode === 'preview' ? 'Roadmap' : mode}
              </button>
            ))}
          </div>
        </div>

        {/* AI Command Bar */}
        <div className="px-4 md:px-8 py-3 bg-slate-950/40 border-b border-slate-800/50">
          <form onSubmit={handleManualAiGenerate} className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="flex-1 flex items-center bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 transition-all focus-within:border-blue-500/50">
              <svg className={`mr-2 md:mr-3 shrink-0 ${isGenerating ? 'animate-spin text-purple-400' : 'text-blue-400'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <input 
                type="text" 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={isGenerating ? `Architecting ${getLevelDisplay(skill.level)} path...` : `Add specific goals for this ${skill.level} phase...`}
                disabled={isGenerating}
                className="w-full bg-transparent border-none text-slate-100 placeholder:text-slate-700 focus:ring-0 outline-none text-xs md:text-sm font-semibold"
              />
            </div>
            <button 
              type="submit" 
              disabled={isGenerating} 
              className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-wider text-[10px] md:text-xs transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap
                ${isGenerating ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'}`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Architecting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="m19 14-7 7-7-7"/></svg>
                  Generate {skill.level} Plan
                </>
              )}
            </button>
          </form>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar relative p-4 md:p-8 transition-opacity duration-500 ${isGenerating ? 'opacity-30' : 'opacity-100'}`}>
          {viewMode === 'edit' && (
            <textarea
              ref={textareaRef}
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:ring-0 outline-none text-slate-200 text-base md:text-lg leading-relaxed resize-none font-medium p-0"
              placeholder="Start drafting notes manually..."
            />
          )}

          {viewMode === 'preview' && (
            <div className="prose-custom max-w-none">
              {content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown> : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-700">
                   <svg className="w-16 h-16 mb-4 opacity-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                   <p className="uppercase font-black tracking-[0.2em] text-[10px]">No Strategy Drafted</p>
                </div>
              )}
            </div>
          )}

          {viewMode === 'checklist' && (
            <div className="space-y-4 md:space-y-6 pb-20">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg md:text-2xl font-black text-white leading-tight truncate">Tier Milestones</h3>
                  <p className="text-[10px] md:text-sm text-slate-500 font-bold uppercase tracking-tighter">Current Phase: {getLevelDisplay(skill.level)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-2xl md:text-4xl font-black transition-all ${progressPercent === 100 ? 'text-emerald-400' : 'text-blue-500'}`}>{progressPercent}%</div>
                  <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-700">Completion</div>
                </div>
              </div>

              <div className="space-y-3">
                {checklist.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => !isGenerating && toggleChecklistItem(item.id)}
                    className={`flex items-start gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all cursor-pointer ${item.completed ? 'bg-emerald-500/5 border-emerald-500/10 opacity-60' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60'} ${isGenerating ? 'cursor-wait pointer-events-none' : ''}`}
                  >
                    <div className={`mt-0.5 w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700 group-hover:border-blue-500'}`}>
                      {item.completed && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs md:text-sm font-black tracking-tight mb-0.5 ${item.completed ? 'text-slate-600 line-through' : 'text-slate-100'}`}>{item.text}</h4>
                      {item.description && <p className={`text-[10px] md:text-xs leading-relaxed ${item.completed ? 'text-slate-700' : 'text-slate-400'}`}>{item.description}</p>}
                    </div>
                  </div>
                ))}
                {checklist.length === 0 && !isGenerating && (
                  <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl group cursor-pointer hover:border-slate-700 transition-colors" onClick={() => performAiGeneration(skill.level)}>
                    <div className="text-slate-700 uppercase font-black tracking-widest text-xs mb-2">Checklist Empty</div>
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tighter">Click to Generate {getLevelDisplay(skill.level)} path</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Level Up Celebration Overlay */}
          {showLevelUp && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-in fade-in zoom-in duration-500 px-6 text-center">
              <div>
                <div className="text-7xl md:text-8xl mb-6 animate-bounce">🌟</div>
                <h3 className="text-3xl md:text-5xl font-black text-white mb-2 uppercase italic tracking-tighter">Level Ascended</h3>
                <p className="text-blue-400 font-black uppercase tracking-widest text-xs md:text-sm animate-pulse mb-6">Now Entering: {getLevelDisplay(skill.level)}</p>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-black uppercase tracking-[0.2em]">
                    <svg className="animate-spin w-4 h-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Regenerating Tier Milestones...
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="px-4 md:px-8 py-3 md:py-4 bg-slate-950/80 border-t border-slate-800 text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] flex justify-between items-center shrink-0 mb-[env(safe-area-inset-bottom)]">
          <div className="flex gap-4">
             <span>{content.length} CHARS</span>
             {checklist.length > 0 && <span className="text-blue-500">{checklist.filter(i => i.completed).length}/{checklist.length} DONE</span>}
          </div>
          <span className="text-slate-700">Gemini 3 Pro Auto-Architect</span>
        </div>
      </div>
    </div>
  );
};

export default NotebookModal;

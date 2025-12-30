
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
      if (nextLevel) handleLevelUp(nextLevel);
    }
  };

  const handleLevelUp = (nextLevel: SkillLevel) => {
    setShowLevelUp(true);
    onUpdate(skill.id, { level: nextLevel });
    setTimeout(() => setShowLevelUp(false), 4000);
  };

  const handleAiGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let levelDefaultContext = skill.level === SkillLevel.DAILY ? "Standard: Day 1, Day 2..." : skill.level === SkillLevel.WEEKLY ? "Standard: Week 1, Week 2..." : "Standard: Monthly/Passive checkpoints.";
      const prompt = `Skill: ${skill.name}. Tier: ${skill.level}. User: ${aiPrompt || 'Complete guide'}. ${levelDefaultContext}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Curriculum architect. JSON with 'notes' (Markdown), 'icon' (emoji), and 'checklist' (title/description items).",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              notes: { type: Type.STRING },
              icon: { type: Type.STRING },
              checklist: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } }
            },
            required: ["notes", "icon", "checklist"]
          }
        }
      });
      const data = JSON.parse(response.text);
      const newItems: ChecklistItem[] = data.checklist.map((item: any) => ({ id: crypto.randomUUID(), text: item.title, description: item.description, completed: false }));
      setContent(aiPrompt.trim() ? `## 🛠 Custom Strategy\n\n` + data.notes : data.notes);
      setChecklist(newItems);
      onUpdate(skill.id, { notes: content, icon: data.icon, checklist: newItems });
      setAiPrompt('');
      setViewMode('checklist');
    } catch (error) { console.error(error); } finally { setIsGenerating(false); }
  };

  const progressPercent = checklist.length > 0 ? Math.round((checklist.filter(i => i.completed).length / checklist.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full md:max-w-4xl bg-slate-900 border-t md:border border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col h-[95vh] md:h-[85vh] overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 duration-500">
        
        {/* Header - Compact for Mobile */}
        <div className="px-4 md:px-8 py-3 md:py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 sticky top-0 z-10">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <div className={`p-2 md:p-2.5 rounded-xl md:rounded-2xl text-xl md:text-2xl flex items-center justify-center shrink-0 w-10 h-10 md:w-12 md:h-12 transition-all ${showLevelUp ? 'bg-amber-400 text-slate-900 shadow-xl' : 'bg-blue-500/10 text-blue-400'}`}>
              {skill.icon || '🎯'}
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-black text-white truncate">{skill.name}</h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] md:text-[10px] px-1.5 py-0.5 rounded font-black uppercase bg-blue-500/10 text-blue-400">{skill.level}</span>
                <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter hidden xs:block">{isSaving ? 'Syncing...' : 'Encrypted'}</span>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* View Switcher - Tabs on Mobile */}
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

        {/* AI Command Bar - More compact on mobile */}
        <div className="px-4 md:px-8 py-3 bg-slate-950/40 border-b border-slate-800/50">
          <form onSubmit={handleAiGenerate} className="flex items-center bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2">
            <svg className={`mr-2 md:mr-3 shrink-0 ${isGenerating ? 'animate-spin text-purple-400' : 'text-blue-400'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            <input 
              type="text" 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={isGenerating ? `Architecting...` : `Customize plan...`}
              disabled={isGenerating}
              className="w-full bg-transparent border-none text-slate-100 placeholder:text-slate-700 focus:ring-0 outline-none text-xs md:text-sm font-semibold"
            />
            <button type="submit" disabled={isGenerating} className="ml-2 text-[10px] font-black uppercase tracking-widest text-blue-500 whitespace-nowrap">
              {isGenerating ? "..." : "AI"}
            </button>
          </form>
        </div>

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar relative p-4 md:p-8 transition-opacity duration-500 ${isGenerating ? 'opacity-30' : 'opacity-100'}`}>
          {viewMode === 'edit' && (
            <textarea
              ref={textareaRef}
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:ring-0 outline-none text-slate-200 text-base md:text-lg leading-relaxed resize-none font-medium p-0"
              placeholder="Start drafting notes..."
            />
          )}

          {viewMode === 'preview' && (
            <div className="prose-custom max-w-none">
              {content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown> : <p className="text-center py-20 text-slate-700 uppercase font-black tracking-widest text-xs">No Strategy Generated</p>}
            </div>
          )}

          {viewMode === 'checklist' && (
            <div className="space-y-4 md:space-y-6 pb-20">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg md:text-2xl font-black text-white leading-tight truncate">Tier Milestones</h3>
                  <p className="text-[10px] md:text-sm text-slate-500 font-bold uppercase tracking-tighter">Ascend to the next mastery tier</p>
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
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`flex items-start gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all cursor-pointer ${item.completed ? 'bg-emerald-500/5 border-emerald-500/10 opacity-60' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60'}`}
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
              </div>
            </div>
          )}

          {/* Celebration Overlay */}
          {showLevelUp && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-in fade-in zoom-in duration-500 px-6 text-center">
              <div>
                <div className="text-7xl md:text-8xl mb-6 animate-bounce">🌟</div>
                <h3 className="text-3xl md:text-5xl font-black text-white mb-2 uppercase italic tracking-tighter">Level Ascended</h3>
                <p className="text-blue-400 font-black uppercase tracking-widest text-xs md:text-sm animate-pulse mb-10">Now Entering the {skill.level} Phase</p>
                <button onClick={() => handleAiGenerate()} className="bg-blue-600 hover:bg-blue-500 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] text-xs md:text-sm shadow-2xl">Re-Strategize</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info - Compact for Mobile */}
        <div className="px-4 md:px-8 py-3 md:py-4 bg-slate-950/80 border-t border-slate-800 text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] flex justify-between items-center shrink-0 mb-[env(safe-area-inset-bottom)]">
          <div className="flex gap-4">
             <span>{content.length} CHARS</span>
             {checklist.length > 0 && <span className="text-blue-500">{checklist.filter(i => i.completed).length}/{checklist.length} DONE</span>}
          </div>
          <span className="text-slate-700">Gemini 3 Pro</span>
        </div>
      </div>
    </div>
  );
};

export default NotebookModal;

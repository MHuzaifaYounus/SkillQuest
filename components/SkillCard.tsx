
import React from 'react';
import { Skill } from '../types';

interface SkillCardProps {
  skill: Skill;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, skill: Skill) => void;
  onClick: (skill: Skill) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, onDelete, onDragStart, onClick }) => {
  const completedCount = skill.checklist?.filter(item => item.completed).length || 0;
  const totalCount = skill.checklist?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isMastered = progress === 100 && totalCount > 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, skill)}
      onClick={() => onClick(skill)}
      className={`animate-card-in group relative bg-slate-900 border p-4 rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 transform hover:-translate-y-1 overflow-hidden
        ${isMastered ? 'border-emerald-500/40 shadow-emerald-500/5' : 'border-slate-800 hover:border-slate-500/50 hover:shadow-blue-500/10'}`}
    >
      <div className="flex items-center justify-between pl-4 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          {skill.icon && (
            <span className={`text-lg shrink-0 transition-all duration-500 ${isMastered ? 'drop-shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-110' : 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}>
              {skill.icon}
            </span>
          )}
          <span className={`font-semibold transition-colors truncate ${isMastered ? 'text-emerald-400' : 'text-slate-100 group-hover:text-white'}`}>
            {skill.name}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(skill.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 text-slate-500 rounded-lg transition-all active:scale-90 flex-shrink-0"
          title="Delete skill"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        </button>
      </div>
      
      <div className="mt-2 flex items-center justify-between pl-4 relative z-10">
        <div className="flex items-center text-[10px] text-slate-500 uppercase tracking-wider font-bold">
          <svg className="mr-1 opacity-50" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          {new Date(skill.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
        
        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <div className={`text-[10px] font-black tracking-tighter ${isMastered ? 'text-emerald-400' : 'text-blue-400/80'}`}>
              {completedCount}/{totalCount}
            </div>
          )}
          {skill.notes && skill.notes.trim() !== '' && (
            <div className={`flex items-center gap-1 text-[10px] font-bold uppercase ${isMastered ? 'text-emerald-400/70' : 'text-blue-400/70'}`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden relative">
          <div 
            className={`h-full transition-all duration-700 ease-out ${isMastered ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-blue-600 to-emerald-500'}`}
            style={{ width: `${progress}%` }}
          >
            <div className={`absolute inset-0 bg-white/20 ${isMastered ? 'animate-none' : 'animate-pulse'}`}></div>
          </div>
        </div>
      )}
      
      {/* Visual drag handle indicator */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-60 transition-opacity z-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
      </div>

      {/* Mastery Glow */}
      {isMastered && (
        <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};

export default SkillCard;

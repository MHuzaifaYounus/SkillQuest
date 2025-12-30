
import React, { useState } from 'react';
import { Column as ColumnType, Skill, SkillLevel } from '../types';
import SkillCard from './SkillCard';

interface ColumnProps {
  column: ColumnType;
  skills: Skill[];
  onDeleteSkill: (id: string) => void;
  onDragStart: (e: React.DragEvent, skill: Skill) => void;
  onDrop: (e: React.DragEvent, level: SkillLevel) => void;
  onSkillClick: (skill: Skill) => void;
}

const Column: React.FC<ColumnProps> = ({ 
  column, 
  skills, 
  onDeleteSkill, 
  onDragStart, 
  onDrop,
  onSkillClick
}) => {
  const [isOver, setIsOver] = useState(false);
  const [justDropped, setJustDropped] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDropInternal = (e: React.DragEvent) => {
    setIsOver(false);
    setJustDropped(true);
    onDrop(e, column.id);
    
    setTimeout(() => {
      setJustDropped(false);
    }, 600);
  };

  return (
    <div 
      className={`flex flex-col md:h-full rounded-2xl border transition-all duration-500 ease-out min-h-[120px] md:min-h-0
        ${column.color} 
        ${isOver ? 'scale-[1.02] md:scale-[1.03] ring-4 ring-white/5 brightness-110 shadow-2xl z-10' : 'shadow-lg'} 
        ${justDropped ? 'animate-success-flash' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropInternal}
    >
      <div className="p-4 md:p-5 border-b border-white/5 bg-white/[0.02] sticky top-0 md:relative z-10 backdrop-blur-sm rounded-t-2xl">
        <div className="flex items-center gap-2 md:gap-3 mb-1">
          <div className={`p-1.5 md:p-2 rounded-lg bg-white/5 transition-transform duration-300 ${isOver ? 'scale-110 rotate-12' : ''}`}>
            {column.icon}
          </div>
          <h2 className="text-base md:text-lg font-black tracking-tight text-white">{column.title}</h2>
          <span className="ml-auto bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-full font-black">
            {skills.length}
          </span>
        </div>
        <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-tighter opacity-80">{column.description}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 custom-scrollbar">
        {skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-700 opacity-20 py-6 md:py-10 transition-opacity">
            <svg className={`w-8 h-8 md:w-10 md:h-10 ${isOver ? 'animate-bounce' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h5l2 3h9a2 2 0 0 1 2 2v2"/><path d="M19 16V22"/><path d="M16 19H22"/></svg>
            <p className="mt-1 md:mt-2 text-[10px] font-black tracking-widest uppercase">Empty</p>
          </div>
        ) : (
          skills.map(skill => (
            <SkillCard 
              key={`${skill.id}-${skill.level}`}
              skill={skill} 
              onDelete={onDeleteSkill}
              onDragStart={onDragStart}
              onClick={onSkillClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Column;

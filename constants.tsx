
import React from 'react';
import { SkillLevel, Column } from './types';

export const COLUMNS: Column[] = [
  {
    id: SkillLevel.DAILY,
    title: 'Level 1: Daily',
    description: 'High frequency active practice.',
    color: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    )
  },
  {
    id: SkillLevel.WEEKLY,
    title: 'Level 2: Weekly',
    description: 'Consistent recurring sessions.',
    color: 'border-purple-500/30 text-purple-400 bg-purple-500/5',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
    )
  },
  {
    id: SkillLevel.MONTHLY,
    title: 'Level 3: Monthly',
    description: 'Deep dive maintenance.',
    color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
    )
  },
  {
    id: SkillLevel.PASSIVE,
    title: 'Level 4: Passive',
    description: 'Subconscious retention.',
    color: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></svg>
    )
  }
];

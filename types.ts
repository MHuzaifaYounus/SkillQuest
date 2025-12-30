
// Import React to resolve 'Cannot find namespace React' error when using React.ReactNode
import React from 'react';

export enum SkillLevel {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  PASSIVE = 'passive'
}

export interface ChecklistItem {
  id: string;
  text: string;
  description: string;
  completed: boolean;
}

export interface Skill {
  id: string;
  name: string;
  level: SkillLevel;
  createdAt: number;
  notes?: string;
  icon?: string;
  checklist?: ChecklistItem[];
}

export interface Column {
  id: SkillLevel;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

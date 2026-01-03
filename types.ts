
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

export interface User {
  id: string;
  email: string;
}

export interface Skill {
  id: string;
  user_id?: string;
  name: string;
  level: SkillLevel;
  createdAt: number;
  notes?: string;
  icon?: string;
  checklist?: ChecklistItem[];
  mentor_context?: string;
  mentor_avatar?: string;
  chat_history?: any[];
}

export interface Column {
  id: SkillLevel;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

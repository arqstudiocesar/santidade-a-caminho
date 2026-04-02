export interface Virtue {
  id: string;
  name: string;
  level: number;
  is_priority: boolean;
  last_evaluated: string | null;
}

export interface JournalEntry {
  id: number;
  content: string;
  type: string;
  created_at: string;
}

export interface Sin {
  id: number;
  content: string;
  is_confessed: boolean;
  created_at: string;
}

export interface DashboardData {
  priorityVirtue: Virtue | null;
  recentJournal: JournalEntry[];
  pendingSinsCount: number;
  today: string;
}

export type TabType = 'dashboard' | 'virtues' | 'prayers' | 'oracoes' | 'journal' | 'confession' | 'bible' | 'lectio' | 'saints' | 'challenges' | 'news';

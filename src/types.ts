export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  color: string;
  tickets: Ticket[];
}

export interface Board {
  id: string;
  name: string;
  description: string;
  color: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceState {
  boards: Board[];
  activeBoardId: string | null;
}

export const BOARD_COLORS = [
  '#4f46e5', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#64748b', // Slate
] as const;

export const COLUMN_COLORS = [
  '#64748b', // Slate
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#06b6d4', // Cyan
] as const;

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; bg: string }
> = {
  low: { label: 'Low', color: '#475569', bg: '#f1f5f9' },
  medium: { label: 'Medium', color: '#0369a1', bg: '#e0f2fe' },
  high: { label: 'High', color: '#b45309', bg: '#fef3c7' },
  urgent: { label: 'Urgent', color: '#be123c', bg: '#ffe4e6' },
};

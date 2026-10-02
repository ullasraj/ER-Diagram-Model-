export interface TableColorTheme {
  stroke: string;
  bg: string;
  border: string;
  text: string;
  name: string;
}

export const DISTINCT_TABLE_COLORS: TableColorTheme[] = [
  { stroke: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', text: '#7dd3fc', name: 'Sky Blue' },
  { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#6ee7b7', name: 'Emerald' },
  { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: '#fcd34d', name: 'Amber' },
  { stroke: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', text: '#c084fc', name: 'Purple' },
  { stroke: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)', text: '#fda4af', name: 'Rose' },
  { stroke: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)', text: '#67e8f9', name: 'Cyan' },
  { stroke: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)', text: '#fdba74', name: 'Orange' },
  { stroke: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)', border: 'rgba(132, 204, 22, 0.4)', text: '#bef264', name: 'Lime' },
  { stroke: '#d946ef', bg: 'rgba(217, 70, 239, 0.15)', border: 'rgba(217, 70, 239, 0.4)', text: '#f0abfc', name: 'Fuchsia' },
  { stroke: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)', border: 'rgba(20, 184, 166, 0.4)', text: '#5eead4', name: 'Teal' },
  { stroke: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)', text: '#a5b4fc', name: 'Indigo' },
  { stroke: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)', text: '#f472b6', name: 'Pink' },
];

export function getEntityColor(entityName: string, index?: number): TableColorTheme {
  if (typeof index === 'number' && index >= 0) {
    return DISTINCT_TABLE_COLORS[index % DISTINCT_TABLE_COLORS.length];
  }
  let hash = 0;
  for (let i = 0; i < entityName.length; i++) {
    hash = entityName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % DISTINCT_TABLE_COLORS.length;
  return DISTINCT_TABLE_COLORS[idx];
}

export type PlayGroupingType = 'Run (No QB Read)' | 'RPO' | 'Pass' | 'Screen' | 'Designed QB Run (No Reads)' | 'Designed QB Run (With Read)' | 'PRO (Pass Run Option)';
export const playGroupingTypeConst = ['Run (No QB Read)', 'RPO', 'Pass', 'Screen', 'Designed QB Run (No Reads)', 'Designed QB Run (With Read)', 'PRO (Pass Run Option)'];

export interface PlayGrouping {
  id: number;
  name: string;
  type: PlayGroupingType;
  team_id: number;
}
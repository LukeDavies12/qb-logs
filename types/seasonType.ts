
export type SeasonType = 'Fall' | 'Spring'

export interface Season {
  id: number;
  year: number;
  team_id: number;
  type: SeasonType;
}

export interface SeasonQB {
  id: number;
  team_qb_id: number;
  season_id: number;
  name: string;
  number: number;
  year: string;
  is_active: boolean;
  is_starter: boolean;
}

export interface SeasonRB {
  id: number;
  team_rb_id: number;
  season_id: number;
  name: string;
  number: number;
  year: string;
  is_active: boolean;
  is_starter: boolean;
}
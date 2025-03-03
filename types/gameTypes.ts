import { PlayGroupingType } from "./playGroupingTypes";

export interface Game {
  id: number;
  date: Date;
  against: string;
  season_id: number;
  drives: GameDrive[];
}

export interface GameDrive {
  id: number;
  game_id: number;
  number_in_game: number;
  Plays: GamePlay[];
}

export interface GamePlay {
  id: number;
  drive_id: number;
  film_number: number;
  qb_in_id: number;
  rb_carry_id: number | null;
  yard_line: number;
  down: number;
  distance: number;
  play_grouping_id: number;
  play_grouping_type: PlayPlayGroupingType | null;
  play_call: string;
  play_call_tags: string | null;
  yards_gained: number;
  result: PlayResult;
  sack_on_qb: boolean | null;
  rpo_read_keys: boolean | null;
  read_option_read_keys: boolean | null;
  pocket_presence: PlayExecutionLevel | null;
  pass_read: PlayExecutionLevel | null;
  pass_ball_placement: PlayExecutionLevel | null;
  scramble_execution: PlayExecutionLevel | null;
  qb_run_execution: PlayExecutionLevel | null;
  audible_opportunity_missed: boolean | null;
  audible_called: boolean | null;
  audible_success: boolean | null;
  rb_vision: PlayExecutionLevel | null;
  rb_run_execution: PlayExecutionLevel | null;
  notes: string | null;
}

export type PlayResult = 'Rush' | 'Rush TD' | 'Complete' | 'Complete TD' | 'Incomplete' | 'Scramble'
                          | 'Scramble TD' | 'Sack' | 'QB Rush' | 'QB Rush TD' | 'Penalty' | 'Interception' | 'Fumble';

export interface PlayPlayGroupingType {
  id: number;
  name: string;
  type: PlayGroupingType;
  team_id: number;
}

export type PlayExecutionLevel = 'Best' | 'Good' | 'Poor' | 'Very Poor';

// TODO get tags w plays
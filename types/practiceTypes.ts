import {
  PlayExecutionLevel,
  PlayPlayGroupingType,
  PlayResult,
  PlayTag,
} from "./gameTypes";

export interface PracticeOnGame {
  id: number;
  date: Date;
  game_id: number;
}

export interface PracticeBlock {
  id: number;
  name: string;
  practice_id: number;
  plays: PracticePlay[];
}

export interface PracticePlay {
  id: number;
  film_number: number;
  practice_block_id: number;
  qb_in_id: number;
  rb_carry_id: number | null;
  play_grouping_id: number;
  play_grouping_type: PlayPlayGroupingType | null;
  qb_in: { id: number; name: string; number: number } | null;
  rb_carry: { id: number; name: string; number: number } | null;
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
  tags: PlayTag[] | null;
}

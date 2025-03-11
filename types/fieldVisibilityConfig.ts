import { PlayResult } from "./gameTypes";
import { PlayGroupingType } from "./playGroupingTypes";

type FieldVisibilityConfig = {
  [playType in PlayGroupingType]?: {
    [playResult in PlayResult]?: string[];
  };
};

export const fieldVisibilityConfig: FieldVisibilityConfig = {
  'RPO': {
    'Complete': ["rpo_read_keys", "pass_ball_placement"],
    'Complete TD': ["rpo_read_keys", "pass_ball_placement"],
    'Incomplete': ["rpo_read_keys", "pass_ball_placement"],
    'Interception': ["rpo_read_keys", "pass_ball_placement"],
    'Rush': ["rpo_read_keys", "rb_in", "rb_vision", "rb_run_execution"],
    'Rush TD': ["rpo_read_keys", "rb_in", "rb_vision", "rb_run_execution"],
    'Scramble': ["rpo_read_keys", "scramble_execution"],
    'Scramble TD': ["rpo_read_keys", "scramble_execution"],
  },
  'PRO (Pass Run Option)': {
    'Complete': ["rpo_read_keys", "pass_ball_placement"],
    'Complete TD': ["rpo_read_keys", "pass_ball_placement"],
    'Incomplete': ["rpo_read_keys", "pass_ball_placement"],
    'Interception': ["rpo_read_keys", "pass_ball_placement"],
    'Rush': ["rpo_read_keys", "rb_vision", "rb_run_execution"],
    'Rush TD': ["rpo_read_keys", "rb_vision", "rb_run_execution"],
    'Scramble': ["rpo_read_keys", "scramble_execution"],
    'Scramble TD': ["rpo_read_keys", "scramble_execution"],
    'QB Rush': ["rpo_read_keys", "qb_run"],
    'QB Rush TD': ["rpo_read_keys", "qb_run"],
  },
  'Pass': {
    'Complete': [
      "pocket_presence",
      "pass_read",
      "pass_ball_placement",
    ],
    'Complete TD': [
      "pocket_presence",
      "pass_read",
      "pass_ball_placement",
    ],
    'Incomplete': [
      "pocket_presence",
      "pass_read",
      "pass_ball_placement",
    ],
    'Interception': [
      "pocket_presence",
      "pass_read",
      "pass_ball_placement",
    ],
    'Sack': ["pocket_presence", "sack_on_qb"],
    'Scramble': ["pocket_presence", "scramble_execution"],
    'Scramble TD': ["pocket_presence", "scramble_execution"],
  },
  'Designed QB Run (No Reads)': {
    'QB Rush': ["qb_run"],
    'QB Rush TD': ["qb_run"],
  },
  'Designed QB Run (With Read)': {
    'Rush': ["read_option_read_keys", "rb_in", "rb_vision", "rb_run_execution"],
    'Rush TD': ["read_option_read_keys", "rb_in", "rb_vision", "rb_run_execution"],
    'QB Rush': ["read_option_read_keys", "qb_run"],
    'QB Rush TD': ["read_option_read_keys", "qb_run"],
  },
  'Screen': {
    'Complete': ["pass_ball_placement"],
    'Complete TD': ["pass_ball_placement"],
    'Incomplete': ["pass_ball_placement"],
    'Interception': ["pass_ball_placement"],
    'Scramble': ["scramble_execution"],
    'Scramble TD': ["scramble_execution"],
  },
  'Run (No QB Read)': {
    'Rush': ["rb_in", "rb_vision", "rb_run_execution"],
    'Rush TD': ["rb_in", "rb_vision", "rb_run_execution"],
  }
};

export const fieldVisibilityOptionsReadable = {
  rpo_read_keys: "RPO Read Keys",
  pass_ball_placement: "Pass Ball Placement",
  rb_in: "RB In",
  rb_vision: "RB Vision",
  rb_run_execution: "RB Run Execution",
  scramble_execution: "Scramble Execution",
  pocket_presence: "Pocket Presence",
  pass_read: "Pass Read",
  sack_on_qb: "Sack on QB",
  read_option_read_keys: "Read Option Read Keys",
  qb_run: "QB Run",
  qb_run_execution: "QB Run Execution",
  audible_opportunity_missed: "Audible Opportunity Missed",
  audible_called: "Audible Called",
  audible_success: "Audible Success"
};

export function getVisibleFields(
  playType: PlayGroupingType,
  playResult: PlayResult
): string[] {
  return fieldVisibilityConfig[playType]?.[playResult] || [];
}

export function getReadableFieldName(fieldName: string): string {
  return fieldName in fieldVisibilityOptionsReadable 
    ? fieldVisibilityOptionsReadable[fieldName as keyof typeof fieldVisibilityOptionsReadable]
    : fieldName;
}
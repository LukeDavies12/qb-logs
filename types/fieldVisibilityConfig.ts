import { PlayResult } from "./gameTypes";
import { PlayGroupingType } from "./playGroupingTypes";

type FieldVisibilityConfig = {
  [playType in PlayGroupingType]?: {
    [playResult in PlayResult]?: string[];
  };
};

export const fieldVisibilityConfig: FieldVisibilityConfig = {
  'RPO': {
    'Complete': ["rpoReadKeys", "passBallPlacement"],
    'Complete TD': ["rpoReadKeys", "passBallPlacement"],
    'Incomplete': ["rpoReadKeys", "passBallPlacement"],
    'Interception': ["rpoReadKeys", "passBallPlacement"],
    'Rush': ["rpoReadKeys", "rbIn", "rbVision", "rbRunExecution"],
    'Rush TD': ["rpoReadKeys", "rbIn", "rbVision", "rbRunExecution"],
    'Scramble': ["rpoReadKeys", "scrambleExecution"],
    'Scramble TD': ["rpoReadKeys", "scrambleExecution"],
  },
  'PRO (Pass Run Option)': {
    'Complete': ["rpoReadKeys", "passBallPlacement"],
    'Complete TD': ["rpoReadKeys", "passBallPlacement"],
    'Incomplete': ["rpoReadKeys", "passBallPlacement"],
    'Interception': ["rpoReadKeys", "passBallPlacement"],
    'Rush': ["rpoReadKeys", "rbVision", "rbRunExecution"],
    'Rush TD': ["rpoReadKeys", "rbVision", "rbRunExecution"],
    'Scramble': ["rpoReadKeys", "scrambleExecution"],
    'Scramble TD': ["rpoReadKeys", "scrambleExecution"],
    'QB Rush': ["rpoReadKeys", "qbRun"],
    'QB Rush TD': ["rpoReadKeys", "qbRun"],
  },
  'Pass': {
    'Complete': [
      "pocketPresence",
      "passRead",
      "passBallPlacement",
    ],
    'Complete TD': [
      "pocketPresence",
      "passRead",
      "passBallPlacement",
    ],
    'Incomplete': [
      "pocketPresence",
      "passRead",
      "passBallPlacement",
    ],
    'Interception': [
      "pocketPresence",
      "passRead",
      "passBallPlacement",
    ],
    'Sack': ["pocketPresence", "sackOnQB"],
    'Scramble': ["pocketPresence", "scrambleExecution"],
    'Scramble TD': ["pocketPresence", "scrambleExecution"],
  },
  'Designed QB Run (No Reads)': {
    'QB Rush': ["qbRun"],
    'QB Rush TD': ["qbRun"],
  },
  'Designed QB Run (With Read)': {
    'Rush': ["readOptionReadKeys", "rbIn", "rbVision", "rbRunExecution"],
    'Rush TD': ["readOptionReadKeys", "rbIn", "rbVision", "rbRunExecution"],
    'QB Rush': ["readOptionReadKeys", "qbRun"],
    'QB Rush TD': ["readOptionReadKeys", "qbRun"],
  },
  'Screen': {
    'Complete': ["passBallPlacement"],
    'Complete TD': ["passBallPlacement"],
    'Incomplete': ["passBallPlacement"],
    'Interception': ["passBallPlacement"],
    'Scramble': ["scrambleExecution"],
    'Scramble TD': ["scrambleExecution"],
  },
  'Run (No QB Read)': {
    'Rush': ["rbIn", "rbVision", "rbRunExecution"],
    'Rush TD': ["rbIn", "rbVision", "rbRunExecution"],
  }
};

export function getVisibleFields(
  playType: PlayGroupingType,
  playResult: PlayResult
): string[] {
  return fieldVisibilityConfig[playType]?.[playResult] || [];
}

const fieldVisibilityOptionsReadable = {
  rpoReadKeys: "RPO Read Keys",
  passBallPlacement: "Pass Ball Placement",
  rbIn: "RB In",
  rbVision: "RB Vision",
  rbRunExecution: "RB Run Execution",
  scrambleExecution: "Scramble Execution",
  pocketPresence: "Pocket Presence",
  passRead: "Pass Read",
  sackOnQB: "Sack on QB",
  readOptionReadKeys: "Read Option Read Keys",
  qbRun: "QB Run",
  qbRunExecution: "QB Run Execution"
};

export function getReadableFieldName(fieldName: keyof typeof fieldVisibilityOptionsReadable): string {
  return fieldVisibilityOptionsReadable[fieldName] || fieldName;
}
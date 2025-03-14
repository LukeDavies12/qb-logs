import { GamePlay, PlayExecutionLevel } from "@/types/gameTypes";
import { exec } from "child_process";

function isGoodOrBest(value: PlayExecutionLevel | null): boolean {
  return value === "Best" || value === "Good";
}

function isYes(value: boolean | null): boolean {
  return value === true;
}

function isNo(value: boolean | null): boolean {
  return value === false;
}

export const evaluatePlay = (
  play: GamePlay
): { involved: boolean; executed: boolean } | null => {
  if (!play.play_grouping_type) return null;

  let involved = false;
  let executed = false;

  const playType = play.play_grouping_type.type;
  const result = play.result;

  switch (playType) {
    case "Pass":
      involved = true;
      if (
        result === "Complete" ||
        result === "Complete TD" ||
        result === "Incomplete"
      ) {
        executed =
          isGoodOrBest(play.pocket_presence) &&
          isGoodOrBest(play.pass_read) &&
          isGoodOrBest(play.pass_ball_placement);
      } else if (result === "Scramble" || result === "Scramble TD") {
        executed =
          isGoodOrBest(play.pocket_presence) &&
          isGoodOrBest(play.scramble_execution);
      } else if (result === "Sack") {
        executed = isGoodOrBest(play.pocket_presence) && isNo(play.sack_on_qb);
      } else if (result === "Interception") {
        executed = false;
      } else {
        executed = false;
      }
      break;

    case "Run (No QB Read)":
      involved = false;
      executed = true;
      break;

    case "RPO":
      involved = true;
      if (
        result === "Complete" ||
        result === "Complete TD" ||
        result === "Incomplete"
      ) {
        executed =
          isYes(play.rpo_read_keys) && isGoodOrBest(play.pass_ball_placement);
      } else if (result === "Scramble" || result === "Scramble TD") {
        executed = isGoodOrBest(play.scramble_execution);
      } else if (result === "Rush" || result === "Rush TD") {
        executed = isYes(play.rpo_read_keys);
      } else if (result === "Sack") {
        executed = isYes(play.rpo_read_keys) && isNo(play.sack_on_qb);
      } else {
        executed = false;
      }
      break;

    case "Designed QB Run (With Read)":
      if (result === "QB Rush" || result === "QB Rush TD") {
        involved = true;
        executed =
          isYes(play.read_option_read_keys) &&
          isGoodOrBest(play.qb_run_execution);
      } else if (result === "Rush" || result === "Rush TD") {
        involved = true;
        executed = isYes(play.read_option_read_keys);
      } else {
        executed = false;
      }
      break;

    case "Screen":
      involved = true;
      if (
        result === "Complete" ||
        result === "Complete TD" ||
        result == "Incomplete"
      ) {
        executed = isGoodOrBest(play.pass_ball_placement);
      } else if (result === "Scramble" || result === "Scramble TD") {
        executed = isGoodOrBest(play.scramble_execution);
      } else if (result === "Sack") {
        executed = isNo(play.sack_on_qb);
      } else {
        executed = false;
      }
      break;

    case "Designed QB Run (No Reads)":
      involved = true;
      if (result === "QB Rush" || result === "QB Rush TD") {
        executed = isGoodOrBest(play.qb_run_execution);
      } else {
        executed = false;
      }
      break;

    case "PRO (Pass Run Option)":
      involved = true;
      if (
        result === "Complete" ||
        result === "Complete TD" ||
        result === "Incomplete"
      ) {
        executed =
          isYes(play.rpo_read_keys) && isGoodOrBest(play.pass_ball_placement);
      } else if (result === "Scramble" || result === "Scramble TD") {
        executed = isGoodOrBest(play.scramble_execution);
      } else if (result === "QB Rush" || result === "QB Rush TD") {
        executed =
          isYes(play.rpo_read_keys) && isGoodOrBest(play.qb_run_execution);
      } else if (result === "Rush" || result === "Rush TD") {
        executed = isYes(play.rpo_read_keys);
      } else if (result === "Sack") {
        executed = isYes(play.rpo_read_keys) && isNo(play.sack_on_qb);
      } else {
        executed = false;
      }
      break;

    default:
      involved = true;
      executed = play.yards_gained > 0;
      break;
  }

  if(result === "Penalty") {
    involved = false;
    executed = true;
  }

  return { involved, executed };
};

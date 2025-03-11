import { GamePlay } from "@/types/gameTypes";

export const evaluatePlay = (play: GamePlay): { involved: boolean; executed: boolean } | null => {
  // Default to null if we can't evaluate
  if (!play.play_grouping_type) return null;

  let involved = false;
  let executed = false;

  // Get the play grouping type from the play_grouping_type object
  const playType = play.play_grouping_type.type;

  switch (playType) {
    case 'Pass':
      involved = true;
      // QB is involved in all pass plays
      // Check if the pass was successful based on various factors
      executed = 
        (play.result === 'Complete' || play.result === 'Complete TD') &&
        (play.pocket_presence === 'Best' || play.pocket_presence === 'Good') &&
        (play.pass_read === 'Best' || play.pass_read === 'Good') &&
        (play.pass_ball_placement === 'Best' || play.pass_ball_placement === 'Good');
      break;

    case 'Run (No QB Read)':
      // For run plays, QB is generally not as heavily involved unless there's a specific metric
      involved = false;
      executed = play.yards_gained > 3; // Simple metric for run success
      break;

    case 'RPO':
      // RPO plays involve QB decision making
      involved = true;
      executed = 
        play.rpo_read_keys === true &&
        ((play.result === 'Complete' || play.result === 'Complete TD' || 
          play.result === 'Rush' || play.result === 'Rush TD') || 
         play.yards_gained > 3);
      break;

    case 'Designed QB Run (With Read)':
      // Read option plays definitely involve the QB
      involved = true;
      executed = 
        play.read_option_read_keys === true &&
        (
          (play.qb_run_execution === 'Best' || play.qb_run_execution === 'Good') ||
          (play.rb_run_execution === 'Best' || play.rb_run_execution === 'Good' && play.yards_gained > 3)
        );
      break;

    default:
      // For other play types, evaluate based on yards gained as a default
      involved = true;
      executed = play.yards_gained > 0;
      break;
  }

  // Special case checks that override the above
  
  // Sacks are always bad for the QB if they're responsible
  if (play.sack_on_qb === true || play.result === 'Sack') {
    involved = true;
    executed = false;
  }

  // Interceptions and fumbles are always negatives
  if (play.result === 'Interception' || play.result === 'Fumble') {
    involved = true;
    executed = false;
  }

  // Touchdowns are always positive
  if (play.result.includes('TD')) {
    executed = true;
  }

  // Scrambles involve the QB
  if (play.result === 'Scramble' || play.result === 'Scramble TD') {
    involved = true;
    executed = play.scramble_execution === 'Best' || play.scramble_execution === 'Good';
  }

  // QB Runs involve the QB
  if (play.result === 'QB Rush' || play.result === 'QB Rush TD') {
    involved = true;
    executed = play.qb_run_execution === 'Best' || play.qb_run_execution === 'Good';
  }

  // Audibles represent QB decision making
  if (play.audible_called === true) {
    involved = true;
    executed = play.audible_success === true;
  }

  // Missed audible opportunities are negative
  if (play.audible_opportunity_missed === true) {
    involved = true;
    executed = false;
  }

  return { involved, executed };
};
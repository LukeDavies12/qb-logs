import { getCurrentSession } from "@/auth/auth";
import H1 from "@/components/H1";
import { sql } from "@/db/db";
import { Game, GameDrive, GamePlay, PlayPlayGroupingType } from "@/types/gameTypes";
import { redirect } from "next/navigation";

export default async function Page({
  params
}: {
  params: { gameId: string };
}) {
  const gameId = Number(params.gameId);
  if (!gameId) redirect("/dashboard");

  // First check if the game's season_id is the user's current season_id
  const { user } = await getCurrentSession();
  const check = await sql`
    SELECT 
      g.season_id
    FROM 
      game g
    WHERE 
      g.id = ${gameId}
  `;

  if (check[0].season_id as number !== user?.current_season_id as number) {
    redirect("/dashboard");
  }

  // Get game w drives, plays, and play_groupings
  const result = await sql`
    SELECT 
      g.id,
      g.date,
      g.against,
      g.season_id,
      gd.id AS drive_id,
      gd.number_in_game AS drive_number,
      p.id AS play_id,
      p.drive_id,
      p.film_number,
      p.qb_in_id,
      p.rb_carry_id,
      p.yard_line,
      p.down,
      p.distance,
      p.play_grouping_id,
      p.play_call,
      p.play_call_tags,
      p.yards_gained,
      p.result,
      p.sack_on_qb,
      p.rpo_read_keys,
      p.read_option_read_keys,
      p.pocket_presence,
      p.pass_read,
      p.pass_ball_placement,
      p.scramble_execution,
      p.qb_run_execution,
      p.audible_opportunity_missed,
      p.audible_called,
      p.audible_success,
      p.rb_vision,
      p.rb_run_execution,
      p.notes,
      pg.id AS pg_id,
      pg.name AS pg_name,
      pg.type AS pg_type,
      pg.team_id AS pg_team_id
    FROM 
      game g
    LEFT JOIN 
      drive gd ON g.id = gd.game_id
    LEFT JOIN 
      play p ON gd.id = p.drive_id
    LEFT JOIN 
      play_grouping pg ON p.play_grouping_id = pg.id
    WHERE 
      g.id = ${gameId}
    ORDER BY 
      gd.number_in_game ASC, 
      p.film_number ASC
  `;

  if (!result || result.length === 0) {
    redirect("/dashboard");
  }

  const firstRow = result[0];
  const game: Game = {
    id: firstRow.id,
    date: new Date(firstRow.date),
    against: firstRow.against,
    season_id: firstRow.season_id,
    drives: []
  };

  const drivesMap: Record<number, GameDrive> = {};

  result.forEach(row => {
    if (!row.drive_id) return;

    if (!drivesMap[row.drive_id]) {
      const drive: GameDrive = {
        id: row.drive_id,
        game_id: row.id,
        number_in_game: row.drive_number,
        Plays: []
      };
      drivesMap[row.drive_id] = drive;
      game.drives.push(drive);
    }

    if (!row.play_id || !row.film_number) return;

    let playGroupingType: PlayPlayGroupingType | null = null;
    if (row.pg_id) {
      playGroupingType = {
        id: row.pg_id,
        name: row.pg_name,
        type: row.pg_type,
        team_id: row.pg_team_id
      };
    }

    const play: GamePlay = {
      id: row.play_id,
      drive_id: row.drive_id,
      film_number: row.film_number,
      qb_in_id: row.qb_in_id,
      rb_carry_id: row.rb_carry_id,
      yard_line: row.yard_line,
      down: row.down,
      distance: row.distance,
      play_grouping_id: row.play_grouping_id,
      play_grouping_type: playGroupingType,
      play_call: row.play_call,
      play_call_tags: row.play_call_tags,
      yards_gained: row.yards_gained,
      result: row.result,
      sack_on_qb: row.sack_on_qb,
      rpo_read_keys: row.rpo_read_keys,
      read_option_read_keys: row.read_option_read_keys,
      pocket_presence: row.pocket_presence,
      pass_read: row.pass_read,
      pass_ball_placement: row.pass_ball_placement,
      scramble_execution: row.scramble_execution,
      qb_run_execution: row.qb_run_execution,
      audible_opportunity_missed: row.audible_opportunity_missed,
      audible_called: row.audible_called,
      audible_success: row.audible_success,
      rb_vision: row.rb_vision,
      rb_run_execution: row.rb_run_execution,
      notes: row.notes
    };

    drivesMap[row.drive_id].Plays.push(play);
  });

  return (
    <>
      <H1 text={`${new Date(game.date).getFullYear()} vs ${game.against}`} />

      <div className="mt-3">
        <h2 className="text-base font-semibold mb-4">Drives</h2>
        {game.drives.map((drive) => (
          <div key={drive.id} className="mb-6 p-4 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Drive {drive.number_in_game}</h3>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 text-left">Play #</th>
                    <th className="py-2 px-3 text-left">Down</th>
                    <th className="py-2 px-3 text-left">Distance</th>
                    <th className="py-2 px-3 text-left">Yard Line</th>
                    <th className="py-2 px-3 text-left">Play Call</th>
                    <th className="py-2 px-3 text-left">Play Group</th>
                    <th className="py-2 px-3 text-left">Result</th>
                    <th className="py-2 px-3 text-left">Yards</th>
                  </tr>
                </thead>
                <tbody>
                  {drive.Plays.map((play) => (
                    <tr key={play.id} className="border-t">
                      <td className="py-2 px-3">{play.film_number}</td>
                      <td className="py-2 px-3">{play.down}</td>
                      <td className="py-2 px-3">{play.distance}</td>
                      <td className="py-2 px-3">{play.yard_line}</td>
                      <td className="py-2 px-3">{play.play_call}</td>
                      <td className="py-2 px-3">{play.play_grouping_type?.name || 'N/A'}</td>
                      <td className="py-2 px-3">{play.result}</td>
                      <td className="py-2 px-3">{play.yards_gained}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
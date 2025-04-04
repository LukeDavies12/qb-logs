import { getCurrentSession } from "@/auth/auth"
import H1 from "@/components/H1"
import H2 from "@/components/H2"
import QBAnalysis from "@/components/QBAnalysis"
import QBAnalysisPractice from "@/components/QBAnalysisPractice"
import { sql } from "@/db/db"
import type { Game, GameDrive, GamePlay, PlayPlayGroupingType } from "@/types/gameTypes"
import type { PracticeBlock, PracticePlay } from "@/types/practiceTypes"
import type { SeasonQB } from "@/types/seasonType"
import Link from "next/link"
import AddGameToFallSeason from "./AddGameToFallSeason"
import AddPracticeToSpringSeason from "./AddPracticeToSpringGame"
import { playGroupingCheck, seasonLengthCheck } from "./Onboarding/newUserCheck"
import PlayGroupingsOnboardingForm from "./Onboarding/PlayGroupings"
import SeasonOnboardingForm from "./Onboarding/Season"

export default async function Page() {
  const user = await getCurrentSession()
  const checkGroupings = await playGroupingCheck(user.user?.team_id as number)
  const hasSeasons = await seasonLengthCheck(user.user?.team_id as number)

  if (!checkGroupings) {
    return (
      <>
        <H1 text={`Welcome, ${user.user?.display_name}! Set up your dashboard in 2 steps to start grading your QBs`} />
        <PlayGroupingsOnboardingForm />
      </>
    )
  }

  if (!hasSeasons) {
    return (
      <>
        <H1 text={`Welcome, ${user.user?.display_name}`} />
        <SeasonOnboardingForm />
      </>
    )
  }

  const result = await sql`
  SELECT 
    t.name AS team_name,
    s.year AS season_year,
    s.type AS season_type
  FROM 
    team t, 
    season s
  WHERE 
    t.id = ${user.user?.team_id} 
    AND s.id = ${user.user?.current_season_id}
  LIMIT 1`

  const { team_name: teamName, season_year: currentSeasonYear, season_type: currentSeasonType } = result[0] || {}

  // Fetch games for the current season
  const gamesQuery = await sql`
    SELECT id, date, against, season_id
    FROM game
    WHERE season_id = ${user.user?.current_season_id as number}
    ORDER BY date ASC
  `

  const games: Game[] = gamesQuery.map((row) => ({
    id: row.id,
    date: new Date(row.date),
    against: row.against,
    season_id: row.season_id,
    drives: [],
  }))

  // Fetch QBs for the current season
  const seasonQBsQuery = await sql`
    SELECT sq.id, sq.name, sq.number, sq.team_qb_id, sq.is_starter
    FROM season_qb sq
    JOIN team_qb tq ON sq.team_qb_id = tq.id
    WHERE sq.season_id = ${user.user?.current_season_id as number}
    AND sq.is_active = true
    ORDER BY sq.is_starter DESC, sq.name ASC
  `

  // Update the seasonQBs mapping to include all required properties
  const seasonQBs: SeasonQB[] = seasonQBsQuery.map((row) => ({
    id: row.id,
    name: row.name,
    number: row.number,
    team_qb_id: row.team_qb_id,
    season_id: user.user?.current_season_id as number,
    year: currentSeasonYear,
    is_active: true, // We're already filtering for active QBs in the SQL query
    is_starter: row.is_starter || false,
  }))

  // Fetch all drives and plays for games in the current season
  for (const game of games) {
    // Fetch drives for this game
    const drivesQuery = await sql`
      SELECT id, game_id, number_in_game
      FROM drive
      WHERE game_id = ${game.id}
      ORDER BY number_in_game ASC
    `

    const drives: GameDrive[] = drivesQuery.map((row) => ({
      id: row.id,
      game_id: row.game_id,
      number_in_game: row.number_in_game,
      Plays: [],
    }))

    // Fetch plays for each drive
    for (const drive of drives) {
      const playsQuery = await sql`
        SELECT 
          p.*,
          pg.id AS pg_id,
          pg.name AS pg_name,
          pg.type AS pg_type,
          pg.team_id AS pg_team_id,
          
          -- Add QB data
          qb.id AS qb_id,
          qb.name AS qb_name,
          qb.number AS qb_number,
          
          -- Add RB data
          rb.id AS rb_id,
          rb.name AS rb_name,
          rb.number AS rb_number,
          
          -- Include drive number for each play
          d.number_in_game AS drive_number_in_game
          
        FROM 
          play p
        LEFT JOIN 
          play_grouping pg ON p.play_grouping_id = pg.id
        JOIN
          drive d ON p.drive_id = d.id
          
        -- Join with QB data
        LEFT JOIN
          season_qb qb ON p.qb_in_id = qb.id
          
        -- Join with RB data
        LEFT JOIN
          season_rb rb ON p.rb_carry_id = rb.id
          
        WHERE 
          p.drive_id = ${drive.id}
        ORDER BY 
          p.film_number ASC
      `

      const plays: GamePlay[] = playsQuery.map((row) => ({
        id: row.id,
        drive_id: row.drive_id,
        drive_number_in_game: row.drive_number_in_game,
        film_number: row.film_number,
        qb_in_id: row.qb_in_id,
        rb_carry_id: row.rb_carry_id,
        yard_line: row.yard_line,
        down: row.down,
        distance: row.distance,
        play_grouping_id: row.play_grouping_id,
        play_grouping_type: row.pg_id
          ? ({
            id: row.pg_id,
            name: row.pg_name,
            type: row.pg_type,
            team_id: row.pg_team_id,
          } as PlayPlayGroupingType)
          : null,
        qb_in: row.qb_id
          ? {
            id: row.qb_id,
            name: row.qb_name,
            number: row.qb_number,
          }
          : null,
        rb_carry: row.rb_id
          ? {
            id: row.rb_id,
            name: row.rb_name,
            number: row.rb_number,
          }
          : null,
        play_call: row.play_call || "",
        play_call_tags: row.play_call_tags,
        yards_gained: row.yards_gained || 0,
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
        notes: row.notes,
        tags: null, // We'll fetch tags separately if needed
      }))

      drive.Plays = plays
    }

    game.drives = drives
  }

  // Fetch practices for Spring season
  const practices: PracticeBlock[] = []

  if (currentSeasonType === "Spring" && games.length > 0) {
    const springGame = games[0]

    const practicesQuery = await sql`
      SELECT id, date, game_id
      FROM practice
      WHERE game_id = ${springGame.id}
      ORDER BY date ASC
    `

    for (const practiceRow of practicesQuery) {
      // Fetch practice blocks for this practice
      const blocksQuery = await sql`
        SELECT id, name, practice_id
        FROM practice_block
        WHERE practice_id = ${practiceRow.id}
        ORDER BY id ASC
      `

      for (const blockRow of blocksQuery) {
        // Fetch plays for this practice block
        const playsQuery = await sql`
          SELECT 
            p.*,
            pg.id AS pg_id,
            pg.name AS pg_name,
            pg.type AS pg_type,
            pg.team_id AS pg_team_id,
            
            -- Add QB data
            qb.id AS qb_id,
            qb.name AS qb_name,
            qb.number AS qb_number,
            
            -- Add RB data
            rb.id AS rb_id,
            rb.name AS rb_name,
            rb.number AS rb_number
            
          FROM 
            play p
          LEFT JOIN 
            play_grouping pg ON p.play_grouping_id = pg.id
            
          -- Join with QB data
          LEFT JOIN
            season_qb qb ON p.qb_in_id = qb.id
            
          -- Join with RB data
          LEFT JOIN
            season_rb rb ON p.rb_carry_id = rb.id
            
          WHERE 
            p.practice_block_id = ${blockRow.id}
          ORDER BY 
            p.film_number ASC
        `

        const plays: PracticePlay[] = playsQuery.map((row) => ({
          id: row.id,
          film_number: row.film_number,
          practice_block_id: row.practice_block_id,
          qb_in_id: row.qb_in_id,
          rb_carry_id: row.rb_carry_id,
          play_grouping_id: row.play_grouping_id,
          play_grouping_type: row.pg_id
            ? ({
              id: row.pg_id,
              name: row.pg_name,
              type: row.pg_type,
              team_id: row.pg_team_id,
            } as PlayPlayGroupingType)
            : null,
          qb_in: row.qb_id
            ? {
              id: row.qb_id,
              name: row.qb_name,
              number: row.qb_number,
            }
            : null,
          rb_carry: row.rb_id
            ? {
              id: row.rb_id,
              name: row.rb_name,
              number: row.rb_number,
            }
            : null,
          play_call: row.play_call || "",
          play_call_tags: row.play_call_tags,
          yards_gained: row.yards_gained || 0,
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
          notes: row.notes,
          tags: null, // We'll fetch tags separately if needed
        }))

        practices.push({
          id: blockRow.id,
          name: blockRow.name,
          practice_id: blockRow.practice_id,
          plays: plays,
        })
      }
    }
  }

  // Get all game plays for each QB
  const qbGamePlays: Record<number, GamePlay[]> = {}
  seasonQBs.forEach((qb) => {
    qbGamePlays[qb.id] = games.flatMap((game) =>
      game.drives.flatMap((drive) => drive.Plays.filter((play) => play.qb_in_id === qb.id)),
    )
  })

  // Get all practice plays for each QB
  const qbPracticePlays: Record<number, PracticePlay[]> = {}
  seasonQBs.forEach((qb) => {
    qbPracticePlays[qb.id] = practices.flatMap((block) => block.plays.filter((play) => play.qb_in_id === qb.id))
  })

  return (
    <>
      <div className="flex gap-2 items-baseline">
        <H1 text={`${teamName}`} />
        <p className="uppercase font-semibold text-xs text-neutral-600 p-1 bg-neutral-50 rounded-sm">
          {currentSeasonType} {currentSeasonYear.toString().slice(-2)}
        </p>
      </div>
      {seasonQBs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-end mb-2">
          {seasonQBs.map((qb) => {
            const qbPlays = games
              .flatMap((game) => game.drives.flatMap((drive) => drive.Plays))
              .filter((play) => play.qb_in_id === qb.id)

            if (qbPlays.length === 0) return null

            return <QBAnalysis key={qb.id} qb={{ name: qb.name, number: qb.number }} plays={qbPlays} />
          })}
        </div>
      )}
      <H2 text="Games" />
      {games.length === 0 ? (
        <p className="text-neutral-600">No games found for the current season.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-1">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/game/${game.id}`}
              className="block px-3 py-2 border rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <div className="text-neutral-900 font-semibold">
                {game.against === "Spring Game" ? "Spring Game" : `vs ${game.against}`}
              </div>
              <div className="text-neutral-600 text-xs">
                {new Date(game.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }) +
                  " " +
                  new Date(game.date).getFullYear().toString().slice(-2)}
              </div>
            </Link>
          ))}
        </div>
      )}
      {currentSeasonType === "Fall" && (
        <div className="mt-6">
          <AddGameToFallSeason />
        </div>
      )}
      {currentSeasonType === "Spring" && practices.length > 0 && seasonQBs.length > 0 && (
        <div className="mt-8 mb-4">
          <H2 text="Practice Analysis" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-end mt-4">
            {seasonQBs.map((qb) => {
              const qbPlays = qbPracticePlays[qb.id]

              if (!qbPlays || qbPlays.length === 0) return null

              return <QBAnalysisPractice key={`practice-${qb.id}`} qb={{ name: qb.name, number: qb.number }} plays={qbPlays} />
            })}
          </div>
        </div>
      )}
      {currentSeasonType === "Spring" && games.length > 0 && (
        <>
          <div className="mt-8">
            <H2 text="Practices" />
            {practices.length === 0 ? (
              <p className="text-neutral-600">No practices found for the spring game.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-1">
                {Array.from(new Set(practices.map((block) => block.practice_id))).map((practiceId) => {
                  const practiceBlocks = practices.filter((block) => block.practice_id === practiceId)
                  const firstBlock = practiceBlocks[0]

                  const practiceDate = new Date() // This would need to be fetched from the database

                  return (
                    <Link
                      key={practiceId}
                      href={`/practice/${practiceId}`}
                      className="block px-3 py-2 border rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <div className="text-neutral-900 font-semibold">Practice</div>
                      <div className="text-neutral-600 text-xs">
                        {practiceDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        }) +
                          " " +
                          practiceDate.getFullYear().toString().slice(-2)}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
            <div className="mt-6">
              <AddPracticeToSpringSeason />
            </div>
          </div>
        </>
      )}
    </>
  )
}


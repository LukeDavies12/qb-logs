import { getCurrentSession } from "@/auth/auth"
import H1 from "@/components/H1"
import H2 from "@/components/H2"
import { sql } from "@/db/db"
import type { Game, GamePractice } from "@/types/gameTypes"
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

  // Fetch games for both Fall and Spring seasons
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

  // Fetch practices for Spring season
  let practices: GamePractice[] = []
  if (currentSeasonType === "Spring" && games.length > 0) {
    // Get the spring game (should be only one)
    const springGame = games[0]

    // Fetch practices associated with the spring game
    const practicesQuery = await sql`
      SELECT id, date, game_id
      FROM practice
      WHERE game_id = ${springGame.id}
      ORDER BY date ASC
    `

    practices = practicesQuery.map((row) => ({
      id: row.id,
      date: new Date(row.date),
      game_id: row.game_id,
    }))
  }

  return (
    <>
      <div className="flex gap-2 items-baseline">
        <H1 text={`${teamName}`} />
        <p className="uppercase font-semibold text-xs text-neutral-600 p-1 bg-neutral-50 rounded-sm">
          {currentSeasonType} {currentSeasonYear.toString().slice(-2)}
        </p>
      </div>

      {/* Always show Games section */}
      <H2 text="Games" />
      {games.length === 0 ? (
        <p className="text-neutral-600">No games found for the current season.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/game/${game.id}`}
              className="block px-3 py-2 border rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <div className="text-neutral-900 font-semibold">
                {game.against === 'Spring Game' ? 'Spring Game' : `vs ${game.against}`}
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

      {/* Show Practices section only for Spring season with a game */}
      {currentSeasonType === "Spring" && games.length > 0 && (
        <>
          <div className="mt-8">
            <H2 text="Practices" />
            {practices.length === 0 ? (
              <p className="text-neutral-600">No practices found for the spring game.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {practices.map((practice) => (
                  <Link
                    key={practice.id}
                    href={`/practice/${practice.id}`}
                    className="block px-3 py-2 border rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <div className="text-neutral-900 font-semibold">Practice</div>
                    <div className="text-neutral-600 text-xs">
                      {new Date(practice.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      }) +
                        " " +
                        new Date(practice.date).getFullYear().toString().slice(-2)}
                    </div>
                  </Link>
                ))}
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


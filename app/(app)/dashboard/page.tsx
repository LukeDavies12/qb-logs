import { getCurrentSession } from "@/auth/auth";
import H1 from "@/components/H1";
import H2 from "@/components/H2";
import SecondaryButton from "@/components/SecondaryButton";
import { sql } from "@/db/db";
import { Game } from "@/types/gameTypes";
import Link from "next/link";
import { playGroupingCheck, seasonLengthCheck } from "./Onboarding/newUserCheck";
import PlayGroupingsOnboardingForm from "./Onboarding/PlayGroupings";
import SeasonOnboardingForm from "./Onboarding/Season";

export default async function Page() {
  const user = await getCurrentSession();
  const checkGroupings = await playGroupingCheck(user.user?.team_id as number);
  const hasSeasons = await seasonLengthCheck(user.user?.team_id as number);

  if (!checkGroupings) {
    return (
      <>
        <H1 text={`Welcome, ${user.user?.display_name}! Set up your dashboard in 2 steps to start grading your QBs`} />
        <PlayGroupingsOnboardingForm />
      </>
    );
  }

  if (!hasSeasons) {
    return (
      <>
        <H1 text={`Welcome, ${user.user?.display_name}`} />
        <SeasonOnboardingForm />
      </>
    );
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
  LIMIT 1`;

  const { team_name: teamName, season_year: currentSeasonYear, season_type: currentSeasonType } = result[0] || {};

  const gamesQuery = await sql`
    SELECT id, date, against, season_id
    FROM game
    WHERE season_id = ${user.user?.current_season_id as number}
    ORDER BY date DESC
`;

  const games: Game[] = gamesQuery.map(row => ({
    id: row.id,
    date: new Date(row.date),
    against: row.against,
    season_id: row.season_id,
    drives: []
  }));

  return (
    <>
      <div className="flex gap-2 items-baseline">
        <H1 text={`${teamName}`} />
        <p className="uppercase font-semibold text-xs text-neutral-600 p-1 bg-neutral-50 rounded-sm">{currentSeasonType} {currentSeasonYear.toString().slice(-2)}</p>
      </div>
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
              <div className="text-neutral-900 font-semibold">vs {game.against}</div>
              <div className="text-neutral-600 text-xs">
                {new Date(game.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                }) + " " + new Date(game.date).getFullYear().toString().slice(-2)}
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-6">
        <Link
          href="/manage-team"
        >
          <SecondaryButton text="New Game" type={"button"} />
        </Link>
      </div>
    </>
  );
}
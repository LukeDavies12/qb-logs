import { getCurrentSession } from "@/auth/auth";
import H1 from "@/components/H1";
import PlayGroupingsOnboardingForm from "./Onboarding/PlayGroupings";
import { playGroupingCheck, seasonLengthCheck } from "./Onboarding/newUserCheck";
import SeasonOnboardingForm from "./Onboarding/Season";
import { sql } from "@/db/db";
import Link from "next/link";
import { Game } from "@/types/gameTypes";
import SecondaryButton from "@/components/SecondaryButton";
import H2 from "@/components/H2";

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

  // Get team name by user team id
  const teamName = (await sql`SELECT name FROM team WHERE id = ${user.user?.team_id} LIMIT 1`)[0].name;

  // Get all games for the current season
  const gamesQuery = await sql`
    SELECT id, date, against, season_id
    FROM game
    WHERE season_id = ${user.user?.current_season_id as number}
    ORDER BY date DESC
`;

  const games: Game[] = gamesQuery.map(row => ({
    id: row.id,
    date: new Date(row.date), // Ensure the date is a Date object
    against: row.against,
    season_id: row.season_id,
    drives: [] // Add an empty array or fetch the drives if available
  }));

  return (
    <>
      <H1 text={`${teamName}`} />
      <H2 text="Games" />

      {games.length === 0 ? (
        <p className="text-neutral-600">No games found for the current season.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/game/${game.id}`}
              className="block p-4 border rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <div className="font-medium">{new Date(game.date).toLocaleDateString()}</div>
              <div className="text-neutral-700">vs. {game.against}</div>
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
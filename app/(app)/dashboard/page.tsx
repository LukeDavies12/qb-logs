import { getCurrentSession } from "@/auth/auth";
import H1 from "@/components/H1";
import PlayGroupingsOnboardingForm from "./Onboarding/PlayGroupings";
import { playGroupingCheck, seasonLengthCheck } from "./Onboarding/newUserCheck";
import SeasonOnboardingForm from "./Onboarding/Season";
import { sql } from "@/db/db";

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

  if(!hasSeasons) {
    return (
      <>
        <H1 text={`Welcome, ${user.user?.display_name}`} />
        <SeasonOnboardingForm />
      </>
    )
  }

  // get team name by user team id
  const teamName = (await sql`SELECT name FROM team WHERE id = ${user.user?.team_id} LIMIT 1`)[0].name

  return (
    <>
      <H1 text={`${teamName}`} />
    </>
  )
}
import { getCurrentSession } from "@/auth/auth";
import H1 from "@/components/H1";
import OnboardingForm from "./Onboarding/PlayGroupings";
import { playGroupingCheck, seasonLengthCheck } from "./Onboarding/newUserCheck";

export default async function Page() {
  const user = await getCurrentSession()
  const checkGroupings = await playGroupingCheck(user.user?.team_id as number)
  const hasSeasons = await seasonLengthCheck(user.user?.team_id as number)

  if (!checkGroupings) {
    return (
      <>
        <H1 text={`Welcome, ${user.user?.display_name}`} />
        <p className="text-lg text-neutral-700 lg:w-1/3 mb-6">
          Let's Create Play Groupings, set up your first game, and begin using QB Logs
        </p>
        <OnboardingForm teamId={user.user?.team_id as number} />
      </>
    )
  }

  if(!hasSeasons) {
    return (
      <>
        <H1 text={`Welcome, ${user.user?.display_name}`} />
        <p className="text-lg text-neutral-700 lg:w-1/3 mb-6">
          Now let's create a season and get straight to using QB Logs
        </p>
        <OnboardingForm teamId={user.user?.team_id as number} />
      </>
    )
  }

  return (
    <>
      <H1 text={`Welcome, ${user.user?.display_name}`} />
    </>
  )
}
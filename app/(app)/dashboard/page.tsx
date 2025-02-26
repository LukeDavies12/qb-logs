import { getCurrentSession } from "@/auth/auth";
import H1 from "@/components/H1";
import OnboardingForm from "./Onboarding/PlayGroupings";
import { playGroupingCheck } from "./Onboarding/newUserCheck";

export default async function Page() {
  const user = await getCurrentSession()
  const checkGroupings = await playGroupingCheck(user.user?.team_id as number)

  if (!checkGroupings) {
    return (
      <>
        <H1 text={`Welcome, ${user.user?.display_name}`} />
        <p className="text-lg text-neutral-700 lg:w-1/3 mb-6">
          Let's Create Play Groupings, set up your first game, and being using QB Logs
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
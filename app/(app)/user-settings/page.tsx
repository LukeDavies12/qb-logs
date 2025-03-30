import { getCurrentSession } from "@/auth/auth"
import H1 from "@/components/H1"
import H2 from "@/components/H2"
import { sql } from "@/db/db"
import type { Season } from "@/types/seasonType"
import { redirect } from "next/navigation"
import { SwitchSeasons } from "./SwitchSeasons"
import { UpdateUsername } from "./UpdateUsername"

export const dynamic = "force-dynamic"

export default async function UserSettingsPage() {
  const session = await getCurrentSession()
  if (!session?.user) {
    redirect("/login")
  }

  const seasons = (await sql`
    SELECT id, year, type, team_id
    FROM season
    WHERE team_id = ${session.user.team_id}
    ORDER BY year DESC, type DESC
  `) as Season[]

  return (
    <>
      <H1 text="User Settings" />
      <div className="lg:grid grid-cols-2 gap-4 w-full">
        <div className="bg-white px-3 py-3 rounded-lg border">
          <H2 text="Season Selection" />
          <SwitchSeasons seasons={seasons} currentSeasonId={session.user.current_season_id as number} />
        </div>
        <div className="bg-white px-3 py-3 rounded-lg border">
          <H2 text="Profile Settings" />
          <UpdateUsername key={`username-${Date.now()}`} currentUsername={session.user.display_name as string} />
        </div>
      </div>
    </>
  )
}


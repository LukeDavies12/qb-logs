import { getCurrentSession } from "@/auth/auth";
import H1 from "@/components/H1";
import { sql } from "@/db/db";
import { PlayGrouping } from "@/types/playGroupingTypes";
import { SeasonQB, SeasonRB } from "@/types/seasonType";
import { Invite, User } from "@/types/userTypes";
import { redirect } from "next/navigation";

interface ManageTeamData {
  currentUser: User;
  seasonQBs: SeasonQB[];
  seasonRBs: SeasonRB[];
  playGroupings: PlayGrouping[];
  teamUsers: User[];
  teamInvites: Invite[];
}

export default async function ManageTeamPage() {
  const { user } = await getCurrentSession();
  if (!user || !user.team_id || !user.current_season_id) {
    redirect("/dashboard");
  }

  const results = await sql`
    WITH current_user_info AS (
      SELECT 
        id, 
        email, 
        password_hash, 
        display_name, 
        job_title, 
        team_id, 
        current_season_id, 
        role 
      FROM 
        "user" 
      WHERE 
        id = ${user.id}
    ),
    season_qbs AS (
      SELECT 
        id, 
        team_qb_id, 
        season_id, 
        name, 
        number, 
        year, 
        is_active, 
        is_starter 
      FROM 
        season_qb 
      WHERE 
        season_id = ${user.current_season_id}
    ),
    season_rbs AS (
      SELECT 
        id, 
        team_rb_id, 
        season_id, 
        name, 
        number, 
        year, 
        is_active, 
        is_starter 
      FROM 
        season_rb 
      WHERE 
        season_id = ${user.current_season_id}
    ),
    team_play_groupings AS (
      SELECT 
        id, 
        name, 
        type, 
        team_id 
      FROM 
        play_grouping 
      WHERE 
        team_id = ${user.team_id}
    ),
    team_users AS (
      SELECT 
        id, 
        email, 
        password_hash, 
        display_name, 
        job_title, 
        team_id, 
        current_season_id, 
        role 
      FROM 
        "user" 
      WHERE 
        team_id = ${user.team_id}
    ),
    team_invites AS (
      SELECT 
        id, 
        created_at, 
        email, 
        display_name, 
        team_id, 
        current_season_id, 
        job_title, 
        role, 
        status, 
        token, 
        expires_at 
      FROM 
        invite 
      WHERE 
        team_id = ${user.team_id}
    )
    SELECT 
      'current_user' as data_type,
      to_json(u.*) as data
    FROM 
      current_user_info u
    UNION ALL
    SELECT 
      'season_qb' as data_type,
      to_json(qb.*) as data
    FROM 
      season_qbs qb
    UNION ALL
    SELECT 
      'season_rb' as data_type,
      to_json(rb.*) as data
    FROM 
      season_rbs rb
    UNION ALL
    SELECT 
      'play_grouping' as data_type,
      to_json(pg.*) as data
    FROM 
      team_play_groupings pg
    UNION ALL
    SELECT 
      'team_user' as data_type,
      to_json(tu.*) as data
    FROM 
      team_users tu
    UNION ALL
    SELECT 
      'team_invite' as data_type,
      to_json(ti.*) as data
    FROM 
      team_invites ti
  `;

  const data: ManageTeamData = {
    currentUser: user as User,
    seasonQBs: [],
    seasonRBs: [],
    playGroupings: [],
    teamUsers: [],
    teamInvites: []
  };

  results.forEach((row) => {
    switch (row.data_type) {
      case 'current_user':
        data.currentUser = row.data as User;
        break;
      case 'season_qb':
        data.seasonQBs.push(row.data as SeasonQB);
        break;
      case 'season_rb':
        data.seasonRBs.push(row.data as SeasonRB);
        break;
      case 'play_grouping':
        data.playGroupings.push(row.data as PlayGrouping);
        break;
      case 'team_user':
        data.teamUsers.push(row.data as User);
        break;
      case 'team_invite':
        const invite = row.data as any;
        invite.created_at = new Date(invite.created_at);
        invite.expires_at = new Date(invite.expires_at);
        data.teamInvites.push(invite as Invite);
        break;
    }
  });

  return (
    <>
      <H1 text="Manage Team" />
      <div className="space-y-6 mb-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:w-1/2">
        <div>
          <h2>Play Groupings</h2>
        </div>
        </div>
      </div>
    </>
  );
}

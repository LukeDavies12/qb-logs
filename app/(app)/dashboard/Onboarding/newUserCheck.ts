"server-only"

import { sql } from "@/db/db";

export async function seasonLengthCheck(teamId: number): Promise<boolean> {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM season
    WHERE id = ${teamId}
  `;

  return result[0].count > 0;
}

export async function playGroupingCheck(teamId: number): Promise<boolean> {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM play_grouping
    WHERE team_id = ${teamId}
  `;

  return result[0].count > 0;
}

"use server"

import { getCurrentSession } from "@/auth/auth"
import { sql } from "@/db/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

interface CreateSeasonParams {
  year: number
  type: "Fall" | "Spring"
  springGameDate?: string
}

interface Player {
  id: number
  name: string
  year: string
  number?: number
  is_active?: boolean
  is_starter?: boolean
}

interface NewPlayer {
  name: string
  year: string
  position: "QB" | "RB"
  number: number
  is_active: boolean
  is_starter: boolean
}

export async function fetchPreviousSeasonPlayers() {
  const { user } = await getCurrentSession()

  if (!user || !user.team_id) {
    return { qbs: [], rbs: [] }
  }

  // Find the most recent season
  const recentSeasons = await sql`
    SELECT id, year, type 
    FROM season 
    WHERE team_id = ${user.team_id}
    ORDER BY year DESC, 
      CASE WHEN type = 'Spring' THEN 1 ELSE 0 END DESC
    LIMIT 1
  `

  if (!recentSeasons.length) {
    return { qbs: [], rbs: [] }
  }

  const recentSeasonId = recentSeasons[0].id

  // Get QBs from the most recent season
  const qbs = await sql`
    SELECT sq.id, sq.name, sq.year, sq.number, sq.is_active, sq.is_starter, tq.id as team_qb_id
    FROM season_qb sq
    JOIN team_qb tq ON sq.team_qb_id = tq.id
    WHERE sq.season_id = ${recentSeasonId}
  `

  // Get RBs from the most recent season
  const rbs = await sql`
    SELECT sr.id, sr.name, sr.year, sr.number, sr.is_active, sr.is_starter, tr.id as team_rb_id
    FROM season_rb sr
    JOIN team_rb tr ON sr.team_rb_id = tr.id
    WHERE sr.season_id = ${recentSeasonId}
  `

  return {
    qbs: qbs.map((qb) => ({
      id: qb.id,
      name: qb.name,
      year: qb.year,
      position: "QB" as const,
      number: qb.number,
      is_active: qb.is_active,
      is_starter: qb.is_starter,
      team_qb_id: qb.team_qb_id,
    })),
    rbs: rbs.map((rb) => ({
      id: rb.id,
      name: rb.name,
      year: rb.year,
      position: "RB" as const,
      number: rb.number,
      is_active: rb.is_active,
      is_starter: rb.is_starter,
      team_rb_id: rb.team_rb_id,
    })),
  }
}

// Fixed createSeason function with proper transaction handling
export async function createSeason(
  params: CreateSeasonParams & {
    carryoverQBs?: Player[]
    carryoverRBs?: Player[]
    newQBs?: NewPlayer[]
    newRBs?: NewPlayer[]
  },
) {
  const { user } = await getCurrentSession()

  if (!user || !user.team_id) {
    redirect("/dashboard")
  }

  // Check if season already exists
  const existingSeason = await sql`
    SELECT id FROM season 
    WHERE team_id = ${user.team_id} 
    AND year = ${params.year} 
    AND type = ${params.type}
  `

  if (existingSeason.length > 0) {
    throw new Error(`A ${params.type} ${params.year} season already exists.`)
  }

  try {
    // First, create the season to get its ID
    const seasonResult = await sql`
      INSERT INTO season (team_id, year, type)
      VALUES (${user.team_id}, ${params.year}, ${params.type})
      RETURNING id
    `

    if (!seasonResult || seasonResult.length === 0) {
      throw new Error("Failed to create season")
    }

    const seasonId = seasonResult[0].id

    // Prepare all the queries for the transaction
    const queries = []

    // 1. Update user's current season
    queries.push(sql`
      UPDATE "user"
      SET current_season_id = ${seasonId}
      WHERE id = ${user.id}
    `)

    // 2. Create a Spring Game if this is a Spring season and a date was provided
    if (params.type === "Spring" && params.springGameDate) {
      queries.push(sql`
        INSERT INTO game (season_id, date, against)
        VALUES (
          ${seasonId},
          ${new Date(params.springGameDate)},
          'Spring Game'
        )
      `)
    }

    // Process carryover QBs and RBs, and new QBs and RBs
    // We need to do these operations outside the main transaction
    // because they require getting IDs from previous operations

    // Execute the transaction for the initial operations
    if (queries.length > 0) {
      await sql.transaction(queries)
    }

    // Now handle players in separate transactions

    // 3. Handle carryover QBs
    if (params.carryoverQBs?.length) {
      for (const qb of params.carryoverQBs) {
        // Get the team_qb_id
        const teamQbResult = await sql`
          SELECT team_qb_id FROM season_qb WHERE id = ${qb.id}
        `

        if (teamQbResult.length > 0) {
          const teamQbId = teamQbResult[0].team_qb_id

          // Insert into season_qb
          await sql`
            INSERT INTO season_qb (team_qb_id, season_id, name, year, number, is_active, is_starter)
            VALUES (
              ${teamQbId}, 
              ${seasonId}, 
              ${qb.name}, 
              ${qb.year}, 
              ${qb.number || null}, 
              ${qb.is_active || true}, 
              ${qb.is_starter || false}
            )
          `
        }
      }
    }

    // 4. Handle carryover RBs
    if (params.carryoverRBs?.length) {
      for (const rb of params.carryoverRBs) {
        // Get the team_rb_id
        const teamRbResult = await sql`
          SELECT team_rb_id FROM season_rb WHERE id = ${rb.id}
        `

        if (teamRbResult.length > 0) {
          const teamRbId = teamRbResult[0].team_rb_id

          // Insert into season_rb
          await sql`
            INSERT INTO season_rb (team_rb_id, season_id, name, year, number, is_active, is_starter)
            VALUES (
              ${teamRbId}, 
              ${seasonId}, 
              ${rb.name}, 
              ${rb.year}, 
              ${rb.number || null}, 
              ${rb.is_active || true}, 
              ${rb.is_starter || false}
            )
          `
        }
      }
    }

    // 5. Handle new QBs
    if (params.newQBs?.length) {
      for (const qb of params.newQBs) {
        // Create team_qb entry and then season_qb entry in a single transaction
        const qbQueries = []

        // First create the team_qb
        const teamQbResult = await sql`
          INSERT INTO team_qb (team_id, name, number)
          VALUES (${user.team_id}, ${qb.name}, ${qb.number})
          RETURNING id
        `

        if (teamQbResult.length > 0) {
          const teamQbId = teamQbResult[0].id

          // Add query to insert into season_qb
          qbQueries.push(sql`
            INSERT INTO season_qb (team_qb_id, season_id, name, year, number, is_active, is_starter)
            VALUES (
              ${teamQbId}, 
              ${seasonId}, 
              ${qb.name}, 
              ${qb.year}, 
              ${qb.number}, 
              ${qb.is_active}, 
              ${qb.is_starter}
            )
          `)

          // Execute the transaction for this QB
          if (qbQueries.length > 0) {
            await sql.transaction(qbQueries)
          }
        }
      }
    }

    // 6. Handle new RBs
    if (params.newRBs?.length) {
      for (const rb of params.newRBs) {
        // Create team_rb entry and then season_rb entry in a single transaction
        const rbQueries = []

        // First create the team_rb
        const teamRbResult = await sql`
          INSERT INTO team_rb (team_id, name, number)
          VALUES (${user.team_id}, ${rb.name}, ${rb.number})
          RETURNING id
        `

        if (teamRbResult.length > 0) {
          const teamRbId = teamRbResult[0].id

          // Add query to insert into season_rb
          rbQueries.push(sql`
            INSERT INTO season_rb (team_rb_id, season_id, name, year, number, is_active, is_starter)
            VALUES (
              ${teamRbId}, 
              ${seasonId}, 
              ${rb.name}, 
              ${rb.year}, 
              ${rb.number}, 
              ${rb.is_active}, 
              ${rb.is_starter}
            )
          `)

          // Execute the transaction for this RB
          if (rbQueries.length > 0) {
            await sql.transaction(rbQueries)
          }
        }
      }
    }
  } catch (error) {
    console.error("Transaction failed:", error)
    throw new Error(`Failed to create season: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}


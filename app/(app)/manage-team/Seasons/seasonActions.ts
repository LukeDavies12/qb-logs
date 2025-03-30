"use server"

import { getCurrentSession } from "@/auth/auth"
import { sql } from "@/db/db"
import { redirect } from "next/navigation"

interface CreateSeasonParams {
  year: number
  type: "Fall" | "Spring"
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

  // Collect all queries to execute in a transaction
  const queries = []

  // Create season
  queries.push(sql`
    INSERT INTO season (team_id, year, type, created_at)
    VALUES (${user.team_id}, ${params.year}, ${params.type}, NOW())
    RETURNING id
  `)

  // Execute the first query to get the season ID
  const result = await sql.transaction(queries)

  if (!result || result.length === 0) {
    throw new Error("Failed to create season")
  }

  // Based on the error, result[0] is an array of records
  // We need to access the first record in that array
  if (!result[0] || !Array.isArray(result[0]) || result[0].length === 0) {
    throw new Error("Failed to retrieve season result")
  }

  // Get the ID from the first record in the array
  const seasonId = result[0][0]?.id
  if (!seasonId) {
    throw new Error("Failed to retrieve season ID")
  }

  // Start a new array of queries for the rest of the operations
  const additionalQueries = []

  // Update user's current season
  additionalQueries.push(sql`
    UPDATE "user"
    SET current_season_id = ${seasonId}
    WHERE id = ${user.id}
  `)

  // Handle carryover QBs
  if (params.carryoverQBs?.length) {
    for (const qb of params.carryoverQBs) {
      // First get the team_qb_id
      const teamQbResult = await sql`
        SELECT team_qb_id FROM season_qb WHERE id = ${qb.id}
      `

      if (teamQbResult.length > 0) {
        const teamQbId = teamQbResult[0].team_qb_id

        // Add query to insert into season_qb
        additionalQueries.push(sql`
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
        `)
      }
    }
  }

  // Handle carryover RBs
  if (params.carryoverRBs?.length) {
    for (const rb of params.carryoverRBs) {
      // First get the team_rb_id
      const teamRbResult = await sql`
        SELECT team_rb_id FROM season_rb WHERE id = ${rb.id}
      `

      if (teamRbResult.length > 0) {
        const teamRbId = teamRbResult[0].team_rb_id

        // Add query to insert into season_rb
        additionalQueries.push(sql`
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
        `)
      }
    }
  }

  // Handle new QBs
  if (params.newQBs?.length) {
    for (const qb of params.newQBs) {
      // We need to create team_qb entries first and get their IDs
      // Since we need the IDs for the next operation, we can't include these in the transaction directly
      // We'll do these one by one
      const teamQbResult = await sql`
        INSERT INTO team_qb (team_id, name, number)
        VALUES (${user.team_id}, ${qb.name}, ${qb.number})
        RETURNING id
      `

      if (teamQbResult.length > 0) {
        const teamQbId = teamQbResult[0].id

        // Add query to insert into season_qb
        additionalQueries.push(sql`
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
      }
    }
  }

  // Handle new RBs
  if (params.newRBs?.length) {
    for (const rb of params.newRBs) {
      // We need to create team_rb entries first and get their IDs
      const teamRbResult = await sql`
        INSERT INTO team_rb (team_id, name, number)
        VALUES (${user.team_id}, ${rb.name}, ${rb.number})
        RETURNING id
      `

      if (teamRbResult.length > 0) {
        const teamRbId = teamRbResult[0].id

        // Add query to insert into season_rb
        additionalQueries.push(sql`
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
      }
    }
  }

  // Execute all the additional queries in a transaction
  if (additionalQueries.length > 0) {
    await sql.transaction(additionalQueries)
  }

  return { id: seasonId }
}

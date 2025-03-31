"use server"
import { getCurrentSession } from "@/auth/auth";
import { sql } from "@/db/db";
import { revalidatePath } from "next/cache";

export async function addGameToFallSeason(prevState: any, formData: FormData) {
  const { user } = await getCurrentSession();
  if (!user) return { error: "Unauthenticated.", success: false }
  
  try {
    // Get the current user's season ID
    const userResult = await sql`
      SELECT u.current_season_id, s.type
      FROM "user" u
      JOIN season s ON u.current_season_id = s.id
      WHERE u.id = ${user.id}
    `
    
    if (!userResult || userResult.length === 0) {
      return { error: "User not found or no current season selected", success: false }
    }
    
    const { current_season_id, type } = userResult[0]
    
    // Check if the season type is fall
    if (type !== "Fall") {
      return { error: "Games can only be added to fall seasons", success: false }
    }
    
    const date = formData.get("date") as string
    const against = formData.get("against") as string
    
    if (!date || !against) {
      return { error: "Date and opponent are required", success: false }
    }
    
    // Insert the new game
    await sql`
      INSERT INTO game (season_id, date, against)
      VALUES (${current_season_id}, ${date}, ${against})
    `
    
    revalidatePath("/dashboard")
    return { success: true, error: "" }
  } catch (error) {
    console.error("Error adding game:", error)
    return { error: "Failed to add game. Please try again.", success: false }
  }
}

export async function addPracticeToSpringSeason(prevState: any, formData: FormData) {
  const { user } = await getCurrentSession()
  if (!user) return { error: "Unauthenticated.", success: false }

  try {
    // Get the current user's season ID and type
    const userResult = await sql`
      SELECT u.current_season_id, s.type
      FROM "user" u
      JOIN season s ON u.current_season_id = s.id
      WHERE u.id = ${user.id}
    `

    if (!userResult || userResult.length === 0) {
      return { error: "User not found or no current season selected", success: false }
    }

    const { current_season_id, type } = userResult[0]

    // Check if the season type is spring
    if (type !== "Spring") {
      return { error: "Practices can only be added to spring seasons", success: false }
    }

    const date = formData.get("date") as string
    const description = formData.get("description") as string

    if (!date) {
      return { error: "Date is required", success: false }
    }

    // Get the game associated with this spring season (if any)
    const gameResult = await sql`
      SELECT id
      FROM game
      WHERE season_id = ${current_season_id}
      LIMIT 1
    `

    // Check if there's more than one game
    const gameCount = await sql`
      SELECT COUNT(*) as count
      FROM game
      WHERE season_id = ${current_season_id}
    `

    if (gameCount[0].count > 1) {
      return { error: "Spring season cannot have more than one game", success: false }
    }

    // Get the game ID if it exists
    const gameId = gameResult.length > 0 ? gameResult[0].id : null

    // Insert the new practice with the game ID if available
    if (gameId) {
      await sql`
        INSERT INTO practice (season_id, date, description, game_id)
        VALUES (${current_season_id}, ${date}, ${description}, ${gameId})
      `
    } else {
      // Insert without game_id if no game exists yet
      await sql`
        INSERT INTO practice (season_id, date, description)
        VALUES (${current_season_id}, ${date}, ${description})
      `
    }

    revalidatePath("/dashboard")
    return { success: true, error: "" }
  } catch (error) {
    console.error("Error adding practice:", error)
    return { error: "Failed to add practice. Please try again.", success: false }
  }
}


"use server"

import { revalidatePath } from "next/cache"
import type { PlayGroupingType } from "@/types/playGroupingTypes"
import { sql } from "@/db/db"

interface PlayGroupingInput {
  name: string
  type: PlayGroupingType
  teamId: number
}

type ActionState = {
  error: string
  success: boolean
}

export async function createPlayGroupings(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const groupings = JSON.parse(formData.get("groupings") as string) as PlayGroupingInput[]
    const teamId = Number.parseInt(formData.get("teamId") as string)

    if (!groupings.length || !teamId) {
      return {
        error: "Invalid input data",
        success: false
      }
    }

    // Insert all play groupings in a single transaction
    await sql`BEGIN`;
    
    try {
      // Insert all play groupings
      for (const grouping of groupings) {
        await sql`
          INSERT INTO play_groupings (name, type, team_id) 
          VALUES (${grouping.name}, ${grouping.type}, ${teamId})
        `;
      }
      
      // Commit the transaction if all inserts succeeded
      await sql`COMMIT`;
    } catch (error) {
      // Rollback the transaction if any insert failed
      await sql`ROLLBACK`;
      throw error; // Re-throw to be caught by the outer try-catch
    }

    revalidatePath("/onboarding")
    return { error: "", success: true }
  } catch (error) {
    console.error("Failed to create play groupings:", error)
    return {
      error: "Failed to create play groupings",
      success: false
    }
  }
}


"use server"

import { sql } from "@/db/db"
import type { PracticeBlock, PracticePlay } from "@/types/practiceTypes"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Define the schema for practice block data
const PracticeBlockSchema = z.object({
  practiceId: z.coerce.number(),
  name: z.string().min(1, "Block name is required"),
})

// Define the return type for the block action
interface ActionStatePracticeBlock {
  error: string
  success: boolean
  blockId?: number
}

// Define the schema for practice play data
const PracticePlaySchema = z.object({
  practiceId: z.coerce.number(),
  blockId: z.coerce.number(),
  filmNumber: z.coerce.number(),
  qbInId: z.coerce.number(),
  rbCarryId: z.coerce.number().optional().nullable(),
  playCall: z.string(),
  playCallTags: z.string().optional(),
  playGroupingId: z.coerce.number(),
  result: z.string(),
  yardsGained: z.coerce.number(),
  pocketPresence: z.string().optional().nullable(),
  passRead: z.string().optional().nullable(),
  passBallPlacement: z.string().optional().nullable(),
  scrambleExecution: z.string().optional().nullable(),
  qbRunExecution: z.string().optional().nullable(),
  rbVision: z.string().optional().nullable(),
  rbRunExecution: z.string().optional().nullable(),
  rpoReadKeys: z.boolean().optional().nullable(),
  readOptionReadKeys: z.boolean().optional().nullable(),
  sackOnQb: z.boolean().optional().nullable(),
  audibleOpportunityMissed: z.boolean().optional().nullable(),
  audibleCalled: z.boolean().optional().nullable(),
  audibleSuccess: z.boolean().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.string().optional(),
})

// Define the return type for the play action
interface ActionStatePracticePlay {
  error: string
  success: boolean
  playId?: number
}

export async function addPracticeBlock(
  prevState: ActionStatePracticeBlock,
  formData: FormData,
): Promise<ActionStatePracticeBlock> {
  let blockId: number | undefined
  let practiceId: number | null = null
  const success = false
  let errorMessage = ""

  try {
    // Convert FormData to object
    const formDataObj = Object.fromEntries(formData)
    console.log("Form data received:", formDataObj)

    // Validate the form data
    const data = PracticeBlockSchema.parse(formDataObj)
    practiceId = data.practiceId

    // Insert the new practice block
    const result = await sql`
      INSERT INTO practice_block (practice_id, name)
      VALUES (${data.practiceId}, ${data.name})
      RETURNING id
    `
  } catch (error: any) {
    console.error("Practice block creation error:", error)
    errorMessage = `Failed to add practice block: ${error.message || "Unknown error"}`
  }

  revalidatePath(`/practices/${practiceId}`, "page")

  return {
    success,
    error: errorMessage,
    blockId,
  }
}

export async function logPlayOnPractice(
  prevState: ActionStatePracticePlay,
  formData: FormData,
): Promise<ActionStatePracticePlay> {
  let playId: number | undefined
  let practiceId: number | null = null
  let success = false
  let errorMessage = ""

  try {
    // Convert FormData to object
    const formDataObj = Object.fromEntries(formData)
    console.log("Form data received:", formDataObj)

    // Get the correct field values
    const blockId = formDataObj.blockId || formDataObj.practiceBlock
    const qbInId = formDataObj.qbInId || formDataObj.qb
    const playGroupingId = formDataObj.playGroupingId || formDataObj.playGrouping

    // Log the values for debugging
    console.log("Critical values:", { blockId, qbInId, playGroupingId })

    // Check for NaN values
    if (!blockId || isNaN(Number(blockId))) {
      return { success: false, error: "Invalid practice block ID" }
    }

    if (!qbInId || isNaN(Number(qbInId))) {
      return { success: false, error: "Invalid QB ID" }
    }

    if (!playGroupingId || isNaN(Number(playGroupingId))) {
      return { success: false, error: "Invalid play grouping ID" }
    }

    // Validate the form data
    const data = PracticePlaySchema.parse({
      practiceId: formDataObj.practiceId,
      blockId: Number(blockId),
      filmNumber: formDataObj.filmNumber,
      qbInId: Number(qbInId),
      rbCarryId: formDataObj.rbCarryId || formDataObj.rb || null,
      playCall: formDataObj.playCall,
      playCallTags: formDataObj.playCallTags || "",
      playGroupingId: Number(playGroupingId),
      result: formDataObj.result,
      yardsGained: formDataObj.yardsGained,
      pocketPresence: formDataObj.pocketPresence || null,
      passRead: formDataObj.passRead || null,
      passBallPlacement: formDataObj.passBallPlacement || null,
      scrambleExecution: formDataObj.scrambleExecution || null,
      qbRunExecution: formDataObj.qbRunExecution || null,
      rbVision: formDataObj.rbVision || null,
      rbRunExecution: formDataObj.rbRunExecution || null,
      rpoReadKeys: formDataObj.rpoReadKeys === "true" ? true : formDataObj.rpoReadKeys === "false" ? false : null,
      readOptionReadKeys:
        formDataObj.readOptionReadKeys === "true" ? true : formDataObj.readOptionReadKeys === "false" ? false : null,
      sackOnQb: formDataObj.sackOnQb === "true" ? true : formDataObj.sackOnQb === "false" ? false : null,
      audibleOpportunityMissed:
        formDataObj.audibleOpportunityMissed === "true"
          ? true
          : formDataObj.audibleOpportunityMissed === "false"
            ? false
            : null,
      audibleCalled: formDataObj.audibleCalled === "true" ? true : formDataObj.audibleCalled === "false" ? false : null,
      audibleSuccess:
        formDataObj.audibleSuccess === "true" ? true : formDataObj.audibleSuccess === "false" ? false : null,
      notes: formDataObj.notes || null,
      tags: formDataObj.tags || "[]",
    })

    practiceId = data.practiceId

    // Parse tags
    const tags = JSON.parse(data.tags || "[]")

    // Insert the new play with practice_block_id (not drive_id)
    const result = await sql`
      INSERT INTO play (
        practice_block_id, drive_id, film_number, qb_in_id, rb_carry_id,
        play_call, play_call_tags, play_grouping_id, result, yards_gained,
        pocket_presence, pass_read, pass_ball_placement, scramble_execution, qb_run_execution,
        rb_vision, rb_run_execution, rpo_read_keys, read_option_read_keys, sack_on_qb,
        audible_opportunity_missed, audible_called, audible_success, notes
      )
      VALUES (
        ${data.blockId}, NULL, ${data.filmNumber}, ${data.qbInId}, ${data.rbCarryId}, 
        ${data.playCall}, ${data.playCallTags}, ${data.playGroupingId},
        ${data.result}, ${data.yardsGained}, ${data.pocketPresence}, ${data.passRead},
        ${data.passBallPlacement}, ${data.scrambleExecution}, ${data.qbRunExecution},
        ${data.rbVision}, ${data.rbRunExecution}, ${data.rpoReadKeys}, ${data.readOptionReadKeys},
        ${data.sackOnQb}, ${data.audibleOpportunityMissed}, ${data.audibleCalled}, ${data.audibleSuccess},
        ${data.notes}
      )
      RETURNING id
    `

    if (!result || result.length === 0) {
      errorMessage = "Failed to create practice play"
    } else {
      playId = result[0].id

      // Add tags if any
      if (tags.length > 0) {
        for (const tagId of tags) {
          await sql`
            INSERT INTO play_tag (play_id, tag_id)
            VALUES (${playId}, ${tagId})
          `
        }
      }

      success = true
    }
  } catch (error: any) {
    console.error("Practice play creation error:", error)
    errorMessage = `Failed to add practice play: ${error.message || "Unknown error"}`
  }

  revalidatePath(`/practices/${practiceId}`, "page")
  return {
    success,
    error: errorMessage,
    playId,
  }
}

export async function updatePlayPractice(play: Partial<PracticePlay>, practiceId: number) {
  try {
    if (!play.id) {
      return { success: false, error: "Missing play ID" }
    }

    // Get the current play data to compare if play grouping changed and to get current values
    const [currentPlay] = await sql`
      SELECT 
        play_grouping_id, 
        practice_block_id,
        film_number,
        qb_in_id,
        play_call,
        result,
        yards_gained
      FROM play WHERE id = ${play.id}
    `

    if (!currentPlay) {
      return { success: false, error: "Play not found" }
    }

    // If practice_block_id is changing and not null/undefined, verify the new block exists
    if (
      play.practice_block_id !== undefined &&
      play.practice_block_id !== null &&
      play.practice_block_id !== currentPlay.practice_block_id
    ) {
      const [blockCheck] = await sql`
        SELECT id FROM practice_block 
        WHERE id = ${play.practice_block_id} AND practice_id = ${practiceId}
      `

      if (!blockCheck) {
        return {
          success: false,
          error: `Practice block ID ${play.practice_block_id} does not exist or does not belong to this practice`,
        }
      }
    }

    // Check if play grouping changed
    const playGroupingChanged =
      currentPlay && play.play_grouping_id !== undefined && currentPlay.play_grouping_id !== play.play_grouping_id

    // If play grouping changed, we need to reset certain fields to null
    if (playGroupingChanged) {
      // These fields should be explicitly set to null if not present
      const fieldsToReset = [
        "rpo_read_keys",
        "read_option_read_keys",
        "pocket_presence",
        "pass_read",
        "pass_ball_placement",
        "scramble_execution",
        "qb_run_execution",
        "audible_opportunity_missed",
        "audible_called",
        "audible_success",
        "rb_vision",
        "rb_run_execution",
        "sack_on_qb",
      ]

      // Set fields to null if they're not explicitly provided
      fieldsToReset.forEach((field) => {
        if (play[field as keyof PracticePlay] === undefined) {
          play[field as keyof PracticePlay] = null as any
        }
      })
    }

    // Update the play with explicit null handling for fields that might be missing
    // Always use the current practice_block_id if not explicitly provided
    await sql`
      UPDATE play SET
        practice_block_id = ${play.practice_block_id ?? currentPlay.practice_block_id},
        film_number = ${play.film_number ?? currentPlay.film_number},
        qb_in_id = ${play.qb_in_id ?? currentPlay.qb_in_id},
        rb_carry_id = ${play.rb_carry_id ?? null},
        play_call = ${play.play_call ?? currentPlay.play_call},
        play_call_tags = ${play.play_call_tags ?? null},
        play_grouping_id = ${play.play_grouping_id ?? currentPlay.play_grouping_id},
        result = ${play.result ?? currentPlay.result},
        yards_gained = ${play.yards_gained ?? currentPlay.yards_gained},
        pocket_presence = ${play.pocket_presence ?? null},
        pass_read = ${play.pass_read ?? null},
        pass_ball_placement = ${play.pass_ball_placement ?? null},
        scramble_execution = ${play.scramble_execution ?? null},
        qb_run_execution = ${play.qb_run_execution ?? null},
        rb_vision = ${play.rb_vision ?? null},
        rb_run_execution = ${play.rb_run_execution ?? null},
        rpo_read_keys = ${play.rpo_read_keys === undefined ? null : play.rpo_read_keys},
        read_option_read_keys = ${play.read_option_read_keys === undefined ? null : play.read_option_read_keys},
        sack_on_qb = ${play.sack_on_qb === undefined ? null : play.sack_on_qb},
        audible_opportunity_missed = ${play.audible_opportunity_missed === undefined ? null : play.audible_opportunity_missed},
        audible_called = ${play.audible_called === undefined ? null : play.audible_called},
        audible_success = ${play.audible_success === undefined ? null : play.audible_success},
        notes = ${play.notes ?? null}
      WHERE id = ${play.id}
    `

    // Handle tags if provided
    if (play.tags) {
      try {
        // Parse tags if it's a string
        const tags = typeof play.tags === "string" ? JSON.parse(play.tags) : play.tags

        // First, remove all existing tag associations for this play
        await sql`DELETE FROM play_tag WHERE play_id = ${play.id}`

        // Handle existing tags vs new tags
        const existingTags = tags.filter((tag: { id: number | null }) => tag.id !== null)
        const newTags = tags.filter((tag: { id: number | null }) => tag.id === null)

        // Insert play_tag associations for existing tags
        if (existingTags.length > 0) {
          for (const tag of existingTags) {
            await sql`
              INSERT INTO play_tag (play_id, tag_id)
              VALUES (${play.id}, ${tag.id})
            `
          }
        }

        // Create new tags and associate them with the play
        if (newTags.length > 0) {
          for (const tag of newTags) {
            if (tag.name) {
              // Get team_id for this practice
              const [practiceInfo] = await sql`
                SELECT team_id
                FROM practice
                WHERE id = ${practiceId}
              `

              // Create new tag
              const [newTag] = await sql`
                INSERT INTO tag (name, team_id)
                VALUES (${tag.name}, ${practiceInfo.team_id})
                RETURNING id
              `

              // Associate new tag with play
              await sql`
                INSERT INTO play_tag (play_id, tag_id)
                VALUES (${play.id}, ${newTag.id})
              `
            }
          }
        }
      } catch (tagError) {
        console.error("Error processing tags:", tagError)
        // Continue execution - we still updated the play successfully
      }
    }

    // Revalidate the practice page
    if (practiceId) {
      revalidatePath(`/practices/${practiceId}`, "page")
    }

    return {
      success: true,
      error: "",
    }
  } catch (error: any) {
    console.error("Error updating practice play:", error)
    return {
      success: false,
      error: `Failed to update practice play: ${error.message || "Unknown error"}`,
    }
  }
}


export async function deletePlayPractice(playId: number, practiceId: number) {
  let success = false
  let errorMessage = ""

  try {
    // Delete tags first (foreign key constraint)
    await sql`
      DELETE FROM play_tag
      WHERE play_id = ${playId}
    `

    // Delete the play
    await sql`
      DELETE FROM play
      WHERE id = ${playId}
    `

    success = true
  } catch (error: any) {
    console.error("Error deleting practice play:", error)
    errorMessage = "An unexpected error occurred"
  }

  // Revalidate the practice page
  if (success && practiceId !== null) {
    revalidatePath(`/practices/${practiceId}`, "page")
  }

  return {
    success,
    error: errorMessage,
  }
}

export async function deleteBlock(blockId: number, practiceId: number) {
  let success = false
  let errorMessage = ""

  try {
    // Get all plays in this block
    const plays = await sql`
      SELECT id FROM play
      WHERE practice_block_id = ${blockId}
    `

    // Delete tags for all plays in this block
    if (plays.length > 0) {
      for (const play of plays) {
        await sql`
          DELETE FROM play_tag
          WHERE play_id = ${play.id}
        `
      }
    }

    // Delete all plays in this block
    await sql`
      DELETE FROM play
      WHERE practice_block_id = ${blockId}
    `

    // Delete the block
    await sql`
      DELETE FROM practice_block
      WHERE id = ${blockId}
    `

    success = true
  } catch (error: any) {
    console.error("Error deleting practice block:", error)
    errorMessage = "An unexpected error occurred"
  }

  // Revalidate the practice page
  if (success && practiceId !== null) {
    revalidatePath(`/practices/${practiceId}`, "page")
  }

  return {
    success,
    error: errorMessage,
  }
}

// In the createBlock function, initialize practiceId at the beginning
export async function createBlock(block: Omit<PracticeBlock, "id">, practiceId: number) {
  let success = false
  let errorMessage = ""
  let data: any = null
  // Ensure practiceId is initialized
  const blockPracticeId = practiceId

  try {
    // Insert the block
    const result = await sql`
      INSERT INTO practice_block (practice_id, name)
      VALUES (${block.practice_id}, ${block.name})
      RETURNING id
    `

    if (!result || result.length === 0) {
      errorMessage = "Failed to create practice block"
    } else {
      const blockId = result[0].id
      success = true
      data = { id: blockId, ...block }
    }
  } catch (error: any) {
    console.error("Error creating practice block:", error)
    errorMessage = "An unexpected error occurred"
  }

  // Revalidate the practice page
  if (success && practiceId !== null) {
    revalidatePath(`/practices/${blockPracticeId}`, "page")
  }

  return {
    success,
    error: errorMessage,
    data,
  }
}

export async function createPlay(play: Omit<PracticePlay, "id">, practiceId: number) {
  let success = false
  let errorMessage = ""
  let data: any = null

  try {
    // Extract tag IDs if present
    const tagIds = play.tags ? play.tags.map((tag) => tag.tag_id) : []

    // Insert the play with practice_block_id (not drive_id)
    const result = await sql`
      INSERT INTO play (
        practice_block_id, drive_id, film_number, qb_in_id, rb_carry_id,
        play_call, play_call_tags, play_grouping_id, result, yards_gained,
        pocket_presence, pass_read, pass_ball_placement, scramble_execution, qb_run_execution,
        rb_vision, rb_run_execution, rpo_read_keys, read_option_read_keys, sack_on_qb,
        audible_opportunity_missed, audible_called, audible_success, notes
      )
      VALUES (
        ${play.practice_block_id}, NULL, ${play.film_number}, ${play.qb_in_id}, ${play.rb_carry_id}, ${play.play_call}, ${play.play_call_tags || ""}, ${play.play_grouping_id},
        ${play.result}, ${play.yards_gained}, ${play.pocket_presence}, ${play.pass_read},
        ${play.pass_ball_placement}, ${play.scramble_execution}, ${play.qb_run_execution},
        ${play.rb_vision}, ${play.rb_run_execution}, ${play.rpo_read_keys}, ${play.read_option_read_keys},
        ${play.sack_on_qb}, ${play.audible_opportunity_missed}, ${play.audible_called}, ${play.audible_success},
        ${play.notes}
      )
      RETURNING id
    `

    if (!result || result.length === 0) {
      errorMessage = "Failed to create practice play"
    } else {
      const playId = result[0].id

      // Add tags if any
      if (tagIds.length > 0) {
        for (const tagId of tagIds) {
          await sql`
            INSERT INTO play_tag (play_id, tag_id)
            VALUES (${playId}, ${tagId})
          `
        }
      }

      success = true
      data = { id: playId, ...play }
    }
  } catch (error: any) {
    console.error("Error creating practice play:", error)
    errorMessage = "An unexpected error occurred"
  }

  revalidatePath(`/practices/${practiceId}`, "page")

  return {
    success,
    error: errorMessage,
    data,
  }
}

export async function updatePlayOnPractice(
  prevState: { error: string; success: boolean },
  formData: FormData,
): Promise<{ error: string; success: boolean }> {
  let success = false
  let errorMessage = ""
  let practiceId: number | null = null

  try {
    const playId = formData.get("updatePlayId")
    const practiceIdValue = formData.get("updatePracticeId")

    if (!playId || !practiceIdValue) {
      return {
        success: false,
        error: "Missing required play or practice ID",
      }
    }

    practiceId = Number(practiceIdValue)

    // Extract form data
    const qbInId = formData.get("updateQb")
    const rbCarryId = formData.get("updateRb") || null
    const filmNumber = formData.get("updateFilmNumber")
    const playCall = formData.get("updatePlayCall")
    const playCallTags = formData.get("updatePlayCallTags") || ""
    const playGroupingId = formData.get("updatePlayGrouping")
    const result = formData.get("updateResult")
    const yardsGained = formData.get("updateYardsGained")

    // Optional fields
    const pocketPresence = formData.get("updatePocketPresence") || null
    const passRead = formData.get("updatePassRead") || null
    const passBallPlacement = formData.get("updatePassBallPlacement") || null
    const scrambleExecution = formData.get("updateScrambleExecution") || null
    const qbRunExecution = formData.get("updateQbRunExecution") || null
    const rbVision = formData.get("updateRbVision") || null
    const rbRunExecution = formData.get("updateRbRunExecution") || null

    // Boolean fields
    const rpoReadKeys =
      formData.get("updateRpoReadKeys") === "true" ? true : formData.get("updateRpoReadKeys") === "false" ? false : null
    const readOptionReadKeys =
      formData.get("updateReadOptionReadKeys") === "true"
        ? true
        : formData.get("updateReadOptionReadKeys") === "false"
          ? false
          : null
    const sackOnQb =
      formData.get("updateSackOnQb") === "true" ? true : formData.get("updateSackOnQb") === "false" ? false : null
    const audibleOpportunityMissed =
      formData.get("updateAudibleOpportunityMissed") === "true"
        ? true
        : formData.get("updateAudibleOpportunityMissed") === "false"
          ? false
          : null
    const audibleCalled =
      formData.get("updateAudibleCalled") === "true"
        ? true
        : formData.get("updateAudibleCalled") === "false"
          ? false
          : null
    const audibleSuccess =
      formData.get("updateAudibleSuccess") === "true"
        ? true
        : formData.get("updateAudibleSuccess") === "false"
          ? false
          : null

    const notes = formData.get("updateNotes") || null
    const tags = formData.get("updateTags") || "[]"

    // Parse tags
    const tagIds = JSON.parse(tags.toString())

    // Update the play
    await sql`
      UPDATE play
      SET 
        qb_in_id = ${qbInId},
        rb_carry_id = ${rbCarryId},
        film_number = ${filmNumber},
        play_call = ${playCall},
        play_call_tags = ${playCallTags},
        play_grouping_id = ${playGroupingId},
        result = ${result},
        yards_gained = ${yardsGained},
        pocket_presence = ${pocketPresence},
        pass_read = ${passRead},
        pass_ball_placement = ${passBallPlacement},
        scramble_execution = ${scrambleExecution},
        qb_run_execution = ${qbRunExecution},
        rb_vision = ${rbVision},
        rb_run_execution = ${rbRunExecution},
        rpo_read_keys = ${rpoReadKeys},
        read_option_read_keys = ${readOptionReadKeys},
        sack_on_qb = ${sackOnQb},
        audible_opportunity_missed = ${audibleOpportunityMissed},
        audible_called = ${audibleCalled},
        audible_success = ${audibleSuccess},
        notes = ${notes}
      WHERE id = ${playId}
    `

    // Delete existing tags
    await sql`
      DELETE FROM play_tag
      WHERE play_id = ${playId}
    `

    // Add new tags
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        await sql`
          INSERT INTO play_tag (play_id, tag_id)
          VALUES (${playId}, ${tagId})
        `
      }
    }

  } catch (error: any) {
    console.error("Error updating practice play:", error)
    errorMessage = `Failed to update practice play: ${error.message || "Unknown error"}`
  }

  revalidatePath(`/practices/${practiceId}`, "page")
  return {
    success,
    error: errorMessage
  }
}


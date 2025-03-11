"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PlayExecutionLevel, PlayResult } from "@/types/gameTypes";
import { sql } from "@/db/db";

// Schema for validating play data
const PlaySchema = z.object({
  gameId: z.coerce.number(),
  driveNum: z.coerce.number(),
  qb: z.coerce.number(),
  rb: z.coerce.number().nullable().optional(),
  filmNumber: z.coerce.number(),
  at: z.coerce.number(),
  down: z.coerce.number(),
  distance: z.coerce.number(),
  playGrouping: z.coerce.number(),
  playCall: z.string(),
  playCallTags: z.string().optional().nullable(),
  result: z.string() as z.ZodType<PlayResult>,
  yardsGained: z.coerce.number(),
  rpoReadKeys: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .nullable(),
  readOptionReadKeys: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .nullable(),
  sackOnQB: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .nullable(),
  rbVision: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  rbRunExecution: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  pocketPresence: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  passRead: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  passBallPlacement: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  scrambleExecution: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  qbRunExecution: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  audibleOpportunityMissed: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .nullable(),
  audibleCalled: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .nullable(),
  audibleSuccess: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(), // Will be JSON string of tag objects
});

export type ActionStatePlay = {
  error: string;
  success: boolean;
} | null;

export async function logPlayOnGame(
  prevState: ActionStatePlay,
  formData: FormData
): Promise<ActionStatePlay> {
  try {
    // Convert FormData to object and log for debugging
    const formDataObj = Object.fromEntries(formData);
    console.log("Form data received:", formDataObj);

    const data = PlaySchema.parse(formDataObj);

    // Find the drive_id based on game_id and drive number
    const [drive] = await sql`
      SELECT id FROM drive
      WHERE game_id = ${data.gameId} AND number_in_game = ${data.driveNum}
    `;

    if (!drive || !drive.id) {
      return {
        error: `Drive with number ${data.driveNum} not found for game ${data.gameId}`,
        success: false,
      };
    }

    const driveId = drive.id;

    // Get play grouping type
    const [playGrouping] = await sql`
      SELECT type FROM play_grouping WHERE id = ${data.playGrouping}
    `;

    // Insert the play
    const [play] = await sql`
      INSERT INTO play (
        drive_id, 
        film_number, 
        qb_in_id, 
        rb_carry_id, 
        yard_line, 
        down, 
        distance, 
        play_grouping_id, 
        play_call, 
        play_call_tags, 
        yards_gained, 
        result, 
        sack_on_qb, 
        rpo_read_keys, 
        read_option_read_keys, 
        pocket_presence, 
        pass_read, 
        pass_ball_placement, 
        scramble_execution, 
        qb_run_execution, 
        audible_opportunity_missed, 
        audible_called, 
        audible_success, 
        rb_vision, 
        rb_run_execution, 
        notes
      ) VALUES (
        ${driveId},
        ${data.filmNumber},
        ${data.qb},
        ${data.rb},
        ${data.at},
        ${data.down},
        ${data.distance},
        ${data.playGrouping},
        ${data.playCall},
        ${data.playCallTags},
        ${data.yardsGained},
        ${data.result},
        ${data.sackOnQB},
        ${data.rpoReadKeys},
        ${data.readOptionReadKeys},
        ${data.pocketPresence},
        ${data.passRead},
        ${data.passBallPlacement},
        ${data.scrambleExecution},
        ${data.qbRunExecution},
        ${data.audibleOpportunityMissed},
        ${data.audibleCalled},
        ${data.audibleSuccess},
        ${data.rbVision},
        ${data.rbRunExecution},
        ${data.notes}
      ) RETURNING id
    `;

    // Process tags if provided
    if (data.tags) {
      try {
        const tags = JSON.parse(data.tags);

        // Handle existing tags
        const existingTags = tags.filter(
          (tag: { id: number | null }) => tag.id !== null
        );
        const newTags = tags.filter(
          (tag: { id: number | null }) => tag.id === null
        );

        // Insert play_tag associations for existing tags
        if (existingTags.length > 0) {
          const values = existingTags.map((tag: { id: number }) => {
            return sql`(${play.id}, ${tag.id})`;
          });

          if (values.length > 0) {
            await sql`
              INSERT INTO play_tag (play_id, tag_id)
              VALUES ${values.map((value: any) => `${value}`).join(", ")}
            `;
          }
        }

        // Create new tags and associate them with the play
        if (newTags.length > 0) {
          for (const tag of newTags) {
            // Get team_id for this play
            const [gameInfo] = await sql`
              SELECT s.team_id
              FROM play p
              JOIN drive d ON p.drive_id = d.id
              JOIN game g ON d.game_id = g.id
              JOIN season s ON g.season_id = s.id
              WHERE p.id = ${play.id}
            `;

            const teamId = gameInfo.team_id;

            // Create new tag
            const [newTag] = await sql`
              INSERT INTO tag (name, team_id)
              VALUES (${tag.name}, ${teamId})
              RETURNING id
            `;

            // Associate new tag with play
            await sql`
              INSERT INTO play_tag (play_id, tag_id)
              VALUES (${play.id}, ${newTag.id})
            `;
          }
        }
      } catch (tagError) {
        console.error("Error processing tags:", tagError);
        // Continue execution - we still created the play successfully
      }
    }

    // Revalidate the game page to show the new play
    revalidatePath(`/game/${data.gameId}`, "page");

    return {
      error: "",
      success: true,
    };
  } catch (error: any) {
    console.error("Play logging error:", error);
    return {
      error: `Failed to log play: ${error.message || "Unknown error"}`,
      success: false,
    };
  }
}

const DriveSchema = z.object({
  gameId: z.coerce.number(),
});

export type ActionStateDrive = {
  error: string;
  success: boolean;
  driveNumber?: number;
} | null;

export async function addDriveToGame(
  prevState: ActionStateDrive,
  formData: FormData
): Promise<ActionStateDrive> {
  try {
    // Convert FormData to object
    const formDataObj = Object.fromEntries(formData);
    console.log("Form data received:", formDataObj);

    const data = DriveSchema.parse(formDataObj);

    // Find the highest drive number in the game
    const [lastDrive] = await sql`
      SELECT MAX(number_in_game) as last_number
      FROM drive
      WHERE game_id = ${data.gameId}
    `;

    const newDriveNumber =
      lastDrive && lastDrive.last_number ? lastDrive.last_number + 1 : 1;

    // Insert the new drive
    await sql`
      INSERT INTO drive (
        game_id,
        number_in_game
      ) VALUES (
        ${data.gameId},
        ${newDriveNumber}
      )
    `;

    // Revalidate the game page to show the new drive
    revalidatePath(`/game/${data.gameId}`, "page");

    return {
      error: "",
      success: true,
      driveNumber: newDriveNumber,
    };
  } catch (error: any) {
    console.error("Drive creation error:", error);
    return {
      error: `Failed to add drive: ${error.message || "Unknown error"}`,
      success: false,
    };
  }
}

export async function deletePlay(
  playId: number,
  gameId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // First delete any play_tag associations
    await sql`DELETE FROM play_tag WHERE play_id = ${playId}`;

    // Then delete the play
    await sql`DELETE FROM play WHERE id = ${playId}`;

    // Revalidate the game page
    revalidatePath(`/game/${gameId}`, "page");

    return { success: true };
  } catch (error: any) {
    console.error("Play deletion error:", error);
    return {
      success: false,
      error: `Failed to delete play: ${error.message || "Unknown error"}`,
    };
  }
}

export async function deleteDrive(
  driveId: number,
  gameId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all plays in this drive to delete their play_tag associations
    const plays = await sql`SELECT id FROM play WHERE drive_id = ${driveId}`;

    // Delete play_tag associations for all plays in this drive
    if (plays.length > 0) {
      const playIds = plays.map((play) => play.id);

      // Delete play tags in batches if there are many plays
      for (let i = 0; i < playIds.length; i += 100) {
        const batch = playIds.slice(i, i + 100);
        await sql`DELETE FROM play_tag WHERE play_id IN (${batch})`;
      }
    }

    // Delete all plays in this drive
    await sql`DELETE FROM play WHERE drive_id = ${driveId}`;

    // Delete the drive
    await sql`DELETE FROM drive WHERE id = ${driveId}`;

    // Revalidate the game page
    revalidatePath(`/game/${gameId}`, "page");

    return { success: true };
  } catch (error: any) {
    console.error("Drive deletion error:", error);
    return {
      success: false,
      error: `Failed to delete drive: ${error.message || "Unknown error"}`,
    };
  }
}

const UpdatePlaySchema = z.object({
  gameId: z.coerce.number(),
  driveId: z.coerce.number(),
  playId: z.coerce.number(),
  driveNum: z.coerce.number(),
  qb: z.coerce.number(),
  rb: z.coerce.number().nullable().optional(),
  filmNumber: z.coerce.number(),
  at: z.coerce.number(),
  down: z.coerce.number(),
  distance: z.coerce.number(),
  playGrouping: z.coerce.number(),
  playCall: z.string(),
  playCallTags: z.string().optional().nullable(),
  result: z.string() as z.ZodType<PlayResult>,
  yardsGained: z.coerce.number(),
  rpoReadKeys: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .nullable(),
  readOptionReadKeys: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .nullable(),
  sackOnQB: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .nullable(),
  rbVision: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  rbRunExecution: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  pocketPresence: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  passRead: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  passBallPlacement: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  scrambleExecution: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  qbRunExecution: z
    .string()
    .optional()
    .nullable() as z.ZodType<PlayExecutionLevel | null>,
  audibleOpportunityMissed: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .nullable(),
  audibleCalled: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .nullable(),
  audibleSuccess: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(), // Will be JSON string of tag objects
});

export async function updatePlayOnGame(
  prevState: ActionStatePlay,
  formData: FormData
): Promise<ActionStatePlay> {
  try {
    // Convert FormData to object and log for debugging
    const formDataObj = Object.fromEntries(formData);
    const data = UpdatePlaySchema.parse(formDataObj);

    // Update the play
    await sql`
      UPDATE play SET
        film_number = ${data.filmNumber},
        qb_in_id = ${data.qb},
        rb_carry_id = ${data.rb},
        yard_line = ${data.at},
        down = ${data.down},
        distance = ${data.distance},
        play_grouping_id = ${data.playGrouping},
        play_call = ${data.playCall},
        play_call_tags = ${data.playCallTags},
        yards_gained = ${data.yardsGained},
        result = ${data.result},
        sack_on_qb = ${data.sackOnQB},
        rpo_read_keys = ${data.rpoReadKeys},
        read_option_read_keys = ${data.readOptionReadKeys},
        pocket_presence = ${data.pocketPresence},
        pass_read = ${data.passRead},
        pass_ball_placement = ${data.passBallPlacement},
        scramble_execution = ${data.scrambleExecution},
        qb_run_execution = ${data.qbRunExecution},
        audible_opportunity_missed = ${data.audibleOpportunityMissed},
        audible_called = ${data.audibleCalled},
        audible_success = ${data.audibleSuccess},
        rb_vision = ${data.rbVision},
        rb_run_execution = ${data.rbRunExecution},
        notes = ${data.notes}
      WHERE id = ${data.playId}
    `;

    // Process tags if provided
    if (data.tags) {
      try {
        const tags = JSON.parse(data.tags);

        // First, remove all existing tag associations for this play
        await sql`DELETE FROM play_tag WHERE play_id = ${data.playId}`;

        // Handle existing tags
        const existingTags = tags.filter(
          (tag: { id: number | null }) => tag.id !== null
        );
        const newTags = tags.filter(
          (tag: { id: number | null }) => tag.id === null
        );

        // Insert play_tag associations for existing tags
        if (existingTags.length > 0) {
          for (const tag of existingTags) {
            await sql`
              INSERT INTO play_tag (play_id, tag_id)
              VALUES (${data.playId}, ${tag.id})
            `;
          }
        }

        // Create new tags and associate them with the play
        if (newTags.length > 0) {
          for (const tag of newTags) {
            // Get team_id for this play
            const [gameInfo] = await sql`
              SELECT s.team_id
              FROM play p
              JOIN drive d ON p.drive_id = d.id
              JOIN game g ON d.game_id = g.id
              JOIN season s ON g.season_id = s.id
              WHERE p.id = ${data.playId}
            `;

            const teamId = gameInfo.team_id;

            // Create new tag
            const [newTag] = await sql`
              INSERT INTO tag (name, team_id)
              VALUES (${tag.name}, ${teamId})
              RETURNING id
            `;

            // Associate new tag with play
            await sql`
              INSERT INTO play_tag (play_id, tag_id)
              VALUES (${data.playId}, ${newTag.id})
            `;
          }
        }
      } catch (tagError) {
        console.error("Error processing tags:", tagError);
        // Continue execution - we still updated the play successfully
      }
    }

    // Revalidate the game page to show the updated play
    revalidatePath(`/game/${data.gameId}`, "page");

    return {
      error: "",
      success: true,
    };
  } catch (error: any) {
    console.error("Play update error:", error);
    return {
      error: `Failed to update play: ${error.message || "Unknown error"}`,
      success: false,
    };
  }
}

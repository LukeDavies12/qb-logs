"use server";

import { revalidatePath } from "next/cache";
import type { PlayGroupingType } from "@/types/playGroupingTypes";
import { sql } from "@/db/db";
import { getCurrentSession } from "@/auth/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

interface PlayGroupingInput {
  name: string;
  type: PlayGroupingType;
  teamId: number;
}

type ActionState = {
  error: string;
  success: boolean;
};

export async function createPlayGroupings(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const groupings = JSON.parse(
      formData.get("groupings") as string
    ) as PlayGroupingInput[];
    const teamId = (await (await getCurrentSession()).user?.team_id) as number;

    if (!groupings.length || !teamId) {
      return {
        error: "Invalid input data",
        success: false,
      };
    }

    try {
      const queries = groupings.map(
        (grouping) =>
          sql`INSERT INTO play_grouping (name, type, team_id) VALUES (${grouping.name}, ${grouping.type}, ${teamId})`
      );

      await sql.transaction(queries);
    } catch (error) {
      throw error;
    }
  } catch (error) {
    return {
      error: "Failed to create play groupings",
      success: false,
    };
  }

  revalidatePath("/dashboard", "page");
  return { error: "", success: true };
}

const PlayerSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  number: z.number().int().positive({ message: "Number must be positive" }),
  year: z.string().min(1, { message: "Year is required" }),
  is_active: z.boolean(),
  is_starter: z.boolean(),
});

const SeasonOnboardingSchema = z.object({
  season_year: z.coerce.number().int().min(2000).max(2100),
  season_type: z.enum(["Fall", "Spring"]),
  season_qbs: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(PlayerSchema).min(1, { message: "At least one QB is required" })
  ),
  season_rbs: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(PlayerSchema).min(1, { message: "At least one RB is required" })
  ),
  game_date: z.string().min(1, { message: "Game date is required" }),
  game_against: z.string().min(1, { message: "Opponent is required" }),
});

export type SeasonInputs = z.infer<typeof SeasonOnboardingSchema>;
export type ActionStateSeason = {
  error: string;
  success: boolean;
  inputs?: Partial<SeasonInputs>;
} | null;

const getFormValues = (formData: FormData) => ({
  season_year: formData.get("season_year") || "",
  season_type: formData.get("season_type") || "",
  season_qbs: formData.get("season_qbs") || "[]",
  season_rbs: formData.get("season_rbs") || "[]",
  game_date: formData.get("game_date") || "",
  game_against: formData.get("game_against") || "",
});

export async function createSeasonAction(
  prevState: ActionStateSeason,
  formData: FormData
): Promise<ActionStateSeason> {
  let gameId: number | null = null;

  try {
    const inputValues = getFormValues(formData);
    const result = SeasonOnboardingSchema.safeParse({
      season_year: inputValues.season_year,
      season_type: inputValues.season_type,
      season_qbs: inputValues.season_qbs,
      season_rbs: inputValues.season_rbs,
      game_date: inputValues.game_date,
      game_against: inputValues.game_against,
    });

    if (!result.success) {
      return {
        error: result.error.errors.map((e) => e.message).join(", "),
        success: false,
        inputs: inputValues as any,
      };
    }

    const data = result.data;
    const session = await getCurrentSession();
    const teamId = session.user?.team_id as number;
    const userId = session.user?.id as number;

    if (!teamId) {
      return {
        error: "User not connected to a team",
        success: false,
        inputs: inputValues as any,
      };
    }

    const [season] = await sql`
      INSERT INTO season (year, type, team_id)
      VALUES (${data.season_year}, ${data.season_type}, ${teamId})
      RETURNING id
    `;
    const [user] = await sql`
      UPDATE user SET current_season_id = ${season.id} WHERE id = ${userId} RETURNING id
    `;
    const [game] = await sql`
      INSERT INTO game (date, opponent, season_id)
      VALUES (${data.game_date}, ${data.game_against}, ${season.id})
      RETURNING id
    `;
    gameId = game.id;
    const qbQueries = data.season_qbs.map(
      (qb) =>
        sql`
      WITH inserted_qb AS (
        INSERT INTO team_qb (name, number, team_id)
        VALUES (${qb.name}, ${qb.number}, ${teamId})
        RETURNING id
      )
      INSERT INTO season_qb (team_qb_id, season_id, name, number, year, is_active, is_starter)
      SELECT id, ${season.id}, ${qb.name}, ${qb.number}, ${qb.year}, ${qb.is_active}, ${qb.is_starter}
      FROM inserted_qb;
      `
    );
    const rbQueries = data.season_rbs.map(
      (rb) =>
        sql`
      WITH inserted_rb AS (
        INSERT INTO team_rb (name, number, team_id)
        VALUES (${rb.name}, ${rb.number}, ${teamId})
        RETURNING id
      )
      INSERT INTO season_rb (team_rb_id, season_id, name, number, year, is_active, is_starter)
      SELECT id, ${season.id}, ${rb.name}, ${rb.number}, ${rb.year}, ${rb.is_active}, ${rb.is_starter}
      FROM inserted_rb;
      `
    );

    await sql.transaction([...qbQueries, ...rbQueries]);
  } catch (error: any) {
    console.error("Season creation error:", error);
    return {
      error: "Failed to create season. Please try again.",
      success: false,
      inputs: getFormValues(formData) as any,
    };
  }

  revalidatePath("/", "layout");
  if (gameId) {
    return redirect(`/game/${gameId}`);
  }

  return {
    error: "",
    success: true,
  };
}

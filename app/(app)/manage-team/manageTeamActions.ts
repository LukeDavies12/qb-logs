"use server";

import { getCurrentSession } from "@/auth/auth";
import { sql } from "@/db/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ActionState = {
  error: string;
  success: boolean;
};

export async function createPlayGrouping(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const teamId = (await (await getCurrentSession()).user?.team_id) as number;
    const isAdmin = (await (await getCurrentSession()).user?.role) === "Admin";
    if (!isAdmin) redirect("/dashboard");

    if (!name || !type || !teamId) {
      return {
        error: "Missing required fields",
        success: false,
      };
    }

    try {
      await sql`INSERT INTO play_grouping (name, type, team_id) VALUES (${name}, ${type}, ${teamId})`;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    return {
      error: "Failed to create play grouping",
      success: false,
    };
  }

  revalidatePath("/manage-team", "page");
  return { error: "", success: true };
}

export async function updatePlayGrouping(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const isAdmin = (await (await getCurrentSession()).user?.role) === "Admin";

    if (!isAdmin) redirect("/dashboard");
    if (!id || !name) {
      return {
        error: "Missing required fields",
        success: false,
      };
    }

    try {
      await sql`UPDATE play_grouping SET name = ${name} WHERE id = ${Number.parseInt(
        id
      )}`;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    return {
      error: "Failed to update play grouping",
      success: false,
    };
  }

  revalidatePath("/manage-team", "page");
  return { error: "", success: true };
}

export async function deletePlayGrouping(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;
    const isAdmin = (await (await getCurrentSession()).user?.role) === "Admin";

    if (!isAdmin) redirect("/dashboard");
    if (!id) {
      return {
        error: "Missing required fields",
        success: false,
      };
    }

    try {
      await sql`DELETE FROM play_grouping WHERE id = ${Number.parseInt(id)}`;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    return {
      error: "Failed to delete play grouping",
      success: false,
    };
  }

  revalidatePath("/manage-team", "page");
  return { error: "", success: true };
}

export async function updateSeasonQB(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;
    const team_qb_id = formData.get("team_qb_id") as string;
    const season_id = formData.get("season_id") as string;
    const name = formData.get("name") as string;
    const number = formData.get("number") as string;
    const year = formData.get("year") as string;
    const is_active = formData.get("is_active") === "true";
    const is_starter = formData.get("is_starter") === "true";

    const isAdmin = (await (await getCurrentSession()).user?.role) === "Admin";

    if (!isAdmin) redirect("/dashboard");

    if (!id || !name || !number) {
      return {
        error: "Missing required fields",
        success: false,
      };
    }

    try {
      // If setting as starter, first check if we need to unset any existing starter
      if (is_starter) {
        // First check if this QB is already the starter
        const currentQB =
          await sql`SELECT is_starter FROM season_qb WHERE id = ${Number.parseInt(
            id
          )}`;

        // If this QB wasn't already the starter, we need to unset any existing starter
        if (currentQB.length > 0 && !currentQB[0].is_starter) {
          // Unset any existing starter for this season
          await sql`UPDATE season_qb SET is_starter = false WHERE season_id = ${Number.parseInt(
            season_id
          )} AND is_starter = true`;
        }
      }

      // Update the QB record
      await sql`
        UPDATE season_qb 
        SET 
          name = ${name}, 
          number = ${Number.parseInt(number)}, 
          year = ${year}, 
          is_active = ${is_active}, 
          is_starter = ${is_starter}
        WHERE id = ${Number.parseInt(id)}
      `;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Action error:", error);
    return {
      error: "Failed to update quarterback",
      success: false,
    };
  }

  revalidatePath("/manage-team", "page");
  return { error: "", success: true };
}

export async function deleteSeasonQB(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      return {
        error: "Missing QB ID",
        success: false,
      };
    }

    const isAdmin = (await (await getCurrentSession()).user?.role) === "Admin";

    if (!isAdmin) redirect("/dashboard");

    try {
      // Get the team_qb_id associated with this season_qb first
      const seasonQbQuery = await sql`
        SELECT team_qb_id 
        FROM season_qb 
        WHERE id = ${Number.parseInt(id)}
      `;

      if (seasonQbQuery.length === 0) {
        return {
          error: "Quarterback not found",
          success: false,
        };
      }

      const team_qb_id = seasonQbQuery[0].team_qb_id;

      // Check if the QB is referenced in any plays
      const referencesCheck = await sql`
        SELECT COUNT(*) as reference_count 
        FROM play
        WHERE qb_in_id = ${Number.parseInt(id)}
      `;

      const referenceCount = Number.parseInt(
        referencesCheck[0].reference_count
      );

      if (referenceCount > 0) {
        return {
          error: `Cannot delete this quarterback because they are used in ${referenceCount} play(s). Please remove these references first.`,
          success: false,
        };
      }
      
      await sql`DELETE FROM season_qb WHERE id = ${Number.parseInt(id)}`;
      await sql`DELETE FROM team_qb WHERE id = ${team_qb_id}`;
      
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Action error:", error);
    return {
      error: "Failed to delete quarterback",
      success: false,
    };
  }

  revalidatePath("/manage-team", "page");
  return { error: "", success: true };
}

export async function addSeasonQB(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const season_id = (await (
      await getCurrentSession()
    ).user?.current_season_id) as number;
    const team_id = (await (await getCurrentSession()).user?.team_id) as number;
    const name = formData.get("name") as string;
    const number = formData.get("number") as string;
    const year = (formData.get("year") as string) || "";
    const is_active = formData.get("is_active") === "true";
    const is_starter = formData.get("is_starter") === "true";

    const isAdmin = (await (await getCurrentSession()).user?.role) === "Admin";

    if (!isAdmin) redirect("/dashboard");

    if (!season_id || !name || !number) {
      return {
        error: "Missing required fields",
        success: false,
      };
    }

    try {
      // If setting as starter, first unset any existing starter
      if (is_starter) {
        await sql`UPDATE season_qb SET is_starter = false WHERE season_id = ${season_id} AND is_starter = true`;
      }

      // Check if team_qb already exists with name, number and team_id
      const qbCheck = await sql`
        SELECT id FROM team_qb WHERE name = ${name} AND number = ${Number.parseInt(
        number
      )} AND team_id = ${team_id}
      `;

      let team_qb_id;

      // If team_qb doesn't exist, create it first
      if (qbCheck.length === 0) {
        const newTeamQb = await sql`
          INSERT INTO team_qb (name, number, team_id)
          VALUES (
            ${name},
            ${Number.parseInt(number)},
            ${team_id}
          )
          RETURNING id
        `;
        team_qb_id = newTeamQb[0].id;
      } else {
        // Use existing team_qb id
        team_qb_id = qbCheck[0].id;
      }

      // Now insert the season_qb record with the team_qb_id
      await sql`
        INSERT INTO season_qb (season_id, team_qb_id, name, number, year, is_active, is_starter)
        VALUES (
          ${season_id},
          ${team_qb_id},
          ${name},
          ${Number.parseInt(number)},
          ${year},
          ${is_active},
          ${is_starter}
        )
      `;
    } catch (error) {
      console.error("Database error:", error);

      // Check for duplicate number error
      if (
        (error as any).message &&
        (error as any).message.includes("duplicate")
      ) {
        return {
          error: "A QB with this number already exists for this season",
          success: false,
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Action error:", error);
    return {
      error: "Failed to add quarterback",
      success: false,
    };
  }

  revalidatePath("/manage-team", "page");
  return { error: "", success: true };
}

export async function updateSeasonRB(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;
    const team_qb_id = formData.get("team_qb_id") as string;
    const season_id = formData.get("season_id") as string;
    const name = formData.get("name") as string;
    const number = formData.get("number") as string;
    const year = formData.get("year") as string;
    const is_active = formData.get("is_active") === "true";
    const is_starter = formData.get("is_starter") === "true";

    const isAdmin = (await (await getCurrentSession()).user?.role) === "Admin";

    if (!isAdmin) redirect("/dashboard");

    if (!id || !name || !number) {
      return {
        error: "Missing required fields",
        success: false,
      };
    }

    try {
      // If setting as starter, first check if we need to unset any existing starter
      if (is_starter) {
        // First check if this RB is already the starter
        const currentRB =
          await sql`SELECT is_starter FROM season_rb WHERE id = ${Number.parseInt(
            id
          )}`;

        // If this QB wasn't already the starter, we need to unset any existing starter
        if (currentRB.length > 0 && !currentRB[0].is_starter) {
          // Unset any existing starter for this season
          await sql`UPDATE season_rb SET is_starter = false WHERE season_id = ${Number.parseInt(
            season_id
          )} AND is_starter = true`;
        }
      }

      // Update the RB record
      await sql`
        UPDATE season_rb
        SET 
          name = ${name}, 
          number = ${Number.parseInt(number)}, 
          year = ${year}, 
          is_active = ${is_active}, 
          is_starter = ${is_starter}
        WHERE id = ${Number.parseInt(id)}
      `;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Action error:", error);
    return {
      error: "Failed to update quarterback",
      success: false,
    };
  }

  revalidatePath("/manage-team", "page");
  return { error: "", success: true };
}

export async function deleteSeasonRB(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      return {
        error: "Missing RB ID",
        success: false,
      };
    }

    const isAdmin = (await (await getCurrentSession()).user?.role) === "Admin";

    if (!isAdmin) redirect("/dashboard");

    try {
      // Get the team_rb_id associated with this season_rb first
      const seasonRbQuery = await sql`
        SELECT team_rb_id 
        FROM season_rb 
        WHERE id = ${Number.parseInt(id)}
      `;

      if (seasonRbQuery.length === 0) {
        return {
          error: "Running back not found",
          success: false,
        };
      }

      const team_rb_id = seasonRbQuery[0].team_rb_id;

      // Check if the RB is referenced in any plays
      const referencesCheck = await sql`
        SELECT COUNT(*) as reference_count 
        FROM play
        WHERE rb_in_id = ${Number.parseInt(id)}
      `;

      const referenceCount = Number.parseInt(
        referencesCheck[0].reference_count
      );

      if (referenceCount > 0) {
        return {
          error: `Cannot delete this running back because they are used in ${referenceCount} play(s). Please remove these references first.`,
          success: false,
        };
      }
      
      await sql`DELETE FROM season_rb WHERE id = ${Number.parseInt(id)}`;
      await sql`DELETE FROM team_rb WHERE id = ${team_rb_id}`;
      
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Action error:", error);
    return {
      error: "Failed to delete running back",
      success: false,
    };
  }

  revalidatePath("/manage-team", "page");
  return { error: "", success: true };
}

export async function addSeasonRB(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const season_id = (await (
      await getCurrentSession()
    ).user?.current_season_id) as number;
    const team_id = (await (await getCurrentSession()).user?.team_id) as number;
    const name = formData.get("name") as string;
    const number = formData.get("number") as string;
    const year = (formData.get("year") as string) || "";
    const is_active = formData.get("is_active") === "true";
    const is_starter = formData.get("is_starter") === "true";

    const isAdmin = (await (await getCurrentSession()).user?.role) === "Admin";

    if (!isAdmin) redirect("/dashboard");

    if (!season_id || !name || !number) {
      return {
        error: "Missing required fields",
        success: false,
      };
    }

    try {
      // If setting as starter, first unset any existing starter
      if (is_starter) {
        await sql`UPDATE season_rb SET is_starter = false WHERE season_id = ${season_id} AND is_starter = true`;
      }

      // Check if team_rb already exists with name, number and team_id
      const rbCheck = await sql`
        SELECT id FROM team_rb WHERE name = ${name} AND number = ${Number.parseInt(
        number
      )} AND team_id = ${team_id}
      `;

      let team_rb_id;

      // If team_rb doesn't exist, create it first
      if (rbCheck.length === 0) {
        const newTeamRb = await sql`
          INSERT INTO team_rb (name, number, team_id)
          VALUES (
            ${name},
            ${Number.parseInt(number)},
            ${team_id}
          )
          RETURNING id
        `;
        team_rb_id = newTeamRb[0].id;
      } else {
        // Use existing team_rb id
        team_rb_id = rbCheck[0].id;
      }

      // Now insert the season_rb record with the team_rb_id
      await sql`
        INSERT INTO season_rb (season_id, team_rb_id, name, number, year, is_active, is_starter)
        VALUES (
          ${season_id},
          ${team_rb_id},
          ${name},
          ${Number.parseInt(number)},
          ${year},
          ${is_active},
          ${is_starter}
        )
      `;
    } catch (error) {
      console.error("Database error:", error);

      // Check for duplicate number error
      if (
        (error as any).message &&
        (error as any).message.includes("duplicate")
      ) {
        return {
          error: "A RB with this number already exists for this season",
          success: false,
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Action error:", error);
    return {
      error: "Failed to add running back",
      success: false,
    };
  }

  revalidatePath("/manage-team", "page");
  return { error: "", success: true };
}

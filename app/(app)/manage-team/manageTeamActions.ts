"use server"

import { getCurrentSession } from "@/auth/auth"
import { sql } from "@/db/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

type ActionState = {
  error: string
  success: boolean
}

export async function createPlayGrouping(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const teamId = (await (await getCurrentSession()).user?.team_id) as number
    const isAdmin = (await (await getCurrentSession()).user?.role) === "Admin"
    if (!isAdmin) redirect("/dashboard")

    if (!name || !type || !teamId) {
      return {
        error: "Missing required fields",
        success: false,
      }
    }

    try {
      await sql`INSERT INTO play_grouping (name, type, team_id) VALUES (${name}, ${type}, ${teamId})`
    } catch (error) {
      throw error
    }
  } catch (error) {
    return {
      error: "Failed to create play grouping",
      success: false,
    }
  }

  revalidatePath("/manage-team", "page")
  return { error: "", success: true }
}

export async function updatePlayGrouping(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const isAdmin = (await (await getCurrentSession()).user?.role) === "Admin"

    if (!isAdmin) redirect("/dashboard")
    if (!id || !name) {
      return {
        error: "Missing required fields",
        success: false,
      }
    }

    try {
      await sql`UPDATE play_grouping SET name = ${name} WHERE id = ${Number.parseInt(id)}`
    } catch (error) {
      throw error
    }
  } catch (error) {
    return {
      error: "Failed to update play grouping",
      success: false,
    }
  }

  revalidatePath("/manage-team", "page")
  return { error: "", success: true }
}

export async function deletePlayGrouping(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = formData.get("id") as string
    const isAdmin = (await (await getCurrentSession()).user?.role) === "Admin"

    if (!isAdmin) redirect("/dashboard")
    if (!id) {
      return {
        error: "Missing required fields",
        success: false,
      }
    }

    try {
      await sql`DELETE FROM play_grouping WHERE id = ${Number.parseInt(id)}`
    } catch (error) {
      throw error
    }
  } catch (error) {
    return {
      error: "Failed to delete play grouping",
      success: false,
    }
  }

  revalidatePath("/manage-team", "page")
  return { error: "", success: true }
}


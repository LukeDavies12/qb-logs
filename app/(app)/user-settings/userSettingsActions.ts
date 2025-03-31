"use server"

import { getCurrentSession } from "@/auth/auth"
import { sql } from "@/db/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateUserCurrentSeason(seasonId: number) {
  const { session, user } = await getCurrentSession()
  if (!user?.id) {
    throw new Error("Not authenticated")
  }

  await sql`
    UPDATE "user"
    SET current_season_id = ${seasonId}
    WHERE id = ${user.id}
  `

  revalidatePath("/", 'layout')
  redirect('/dashboard')
}

export async function updateUsername(newUsername: string) {
  const { session, user } = await getCurrentSession()
  if (!user?.id) {
    throw new Error("Not authenticated")
  }

  await sql`
    UPDATE "user"
    SET display_name = ${newUsername}
    WHERE id = ${user.id}
  `

  revalidatePath("/")
} 
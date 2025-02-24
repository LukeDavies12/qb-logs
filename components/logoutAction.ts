'use server'

import { deleteSession } from "@/auth/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function logout() {
  deleteSession()
  revalidatePath('/')
  return redirect('/')
}
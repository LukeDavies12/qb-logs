"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sql } from '@/db/db'
import { generateSessionToken, setSessionTokenCookie } from '@/auth/auth'
import { hash } from 'bcrypt'

// Schema and types
const JoinSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  display_name: z.string().min(2, { message: 'Display name must be at least 2 characters long.' }),
  job_title: z.string().min(2, { message: 'Job title must be at least 2 characters long.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
  team_name: z.string().min(2, { message: 'Team name must be at least 2 characters long.' }),
  team_city: z.string().min(2, { message: 'Team city must be at least 2 characters long.' }),
  team_state: z.string().length(2, { message: 'State must be exactly 2 characters long.' })
})

type JoinFormInputs = z.infer<typeof JoinSchema>
type ActionState = { error: string, inputs?: Partial<JoinFormInputs> } | null

// Helper function to get form values
const getFormValues = (formData: FormData) => ({
  email: String(formData.get('email') || ''),
  display_name: String(formData.get('display_name') || ''),
  job_title: String(formData.get('job_title') || ''),
  password: String(formData.get('password') || ''),
  team_name: String(formData.get('team_name') || ''),
  team_city: String(formData.get('team_city') || ''),
  team_state: String(formData.get('team_state') || '')
})

export async function joinAction(state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    // Get and validate input values
    const inputValues = getFormValues(formData)
    const result = JoinSchema.safeParse(inputValues)

    // Return validation errors if any
    if (!result.success) {
      return {
        error: result.error.errors.map(e => e.message).join(', '),
        inputs: inputValues
      }
    }

    const data = result.data
    
    // Create team
    const [team] = await sql`
      INSERT INTO team (name, city, state)
      VALUES (${data.team_name}, ${data.team_city}, ${data.team_state})
      RETURNING id
    `
    
    // Create user with hashed password
    const passwordHash = await hash(data.password, 10)
    const [user] = await sql`
      INSERT INTO "user" (
        email, display_name, job_title, password_hash, team_id, role
      ) VALUES (
        ${data.email}, ${data.display_name}, ${data.job_title}, 
        ${passwordHash}, ${team.id}, 'Admin'
      ) RETURNING id
    `
    
    // Create session and set cookie
    const token = generateSessionToken()
    await sql`
      INSERT INTO session (id, user_id, expires_at)
      VALUES (
        ${token}, 
        ${user.id}, 
        ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
      )
    `
    await setSessionTokenCookie(token)
  } catch (error: any) {
    return {
      error: 'Something went wrong. Please try again.',
      inputs: getFormValues(formData)
    }
  }

  revalidatePath('/')
  return redirect('/dashboard')
}
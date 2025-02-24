"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sql } from '@/db/db'
import { generateSessionToken, createSession, setSessionTokenCookie } from '@/auth/auth'
import { hash } from 'bcrypt'

const JoinSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  display_name: z.string().min(2, { message: 'Display name must be at least 2 characters long.' }),
  job_title: z.string().min(2, { message: 'Job title must be at least 2 characters long.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
  team_name: z.string().min(2, { message: 'Team name must be at least 2 characters long.' }),
  team_city: z.string().min(2, { message: 'Team city must be at least 2 characters long.' }),
  team_state: z.string().length(2, { message: 'State must be exactly 2 characters long.' })
})

export async function joinAction(formData: FormData) {
  try {
    // Validate input
    const data = JoinSchema.parse({
      email: formData.get('email'),
      display_name: formData.get('display_name'),
      job_title: formData.get('job_title'),
      password: formData.get('password'),
      team_name: formData.get('team_name'),
      team_city: formData.get('team_city'),
      team_state: formData.get('team_state')
    })

    // Create team first and get its ID
    const teamResult = await sql`
      INSERT INTO team (name, city, state)
      VALUES (${data.team_name}, ${data.team_city}, ${data.team_state})
      RETURNING id;
    `
    const teamId = teamResult[0].id

    // Hash password
    const passwordHash = await hash(data.password, 10)

    // Create user
    const userResult = await sql`
      INSERT INTO "user" (
        email,
        display_name,
        job_title,
        password_hash,
        team_id,
        role
      )
      VALUES (
        ${data.email},
        ${data.display_name},
        ${data.job_title},
        ${passwordHash},
        ${teamId},
        'Default'
      )
      RETURNING id;
    `
    const userId = userResult[0].id

    // Create session
    const token = generateSessionToken()
    await sql`
      INSERT INTO session (id, user_id, expires_at)
      VALUES (
        ${token},
        ${userId},
        ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
      );
    `
    
    await setSessionTokenCookie(token)
    
    revalidatePath('/')
    redirect('/dashboard')
  } catch (error) {
    console.error('Join error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        error: error.errors.map(e => e.message).join(', ')
      }
    }
    
    // Check for unique constraint violations
    if ((error as any).code === '23505') { // PostgreSQL unique violation code
      const pgError = error as { constraint: string }
      if (pgError.constraint === 'user_email_key') {
        return {
          error: 'This email is already registered.'
        }
      }
      if ((error as any).constraint === 'team_name_key') {
        return {
          error: 'This team name is already taken.'
        }
      }
    }
    
    return {
      error: 'Something went wrong. Please try again.'
    }
  }
}
"server-only";

import { sql } from "@/db/db";
import { Session, User } from "@/types/userTypes";
import { sha256 } from "@oslojs/crypto/sha2";
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { cookies } from "next/headers";
import { cache } from "react";

// Type definitions for session validation results
type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };

/**
 * TOKEN MANAGEMENT
 * Functions for generating and managing session tokens
 */

/**
 * Generates a cryptographically secure random session token
 * Uses 20 bytes (160 bits) of entropy encoded in base32
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

/**
 * DATABASE OPERATIONS
 * Functions for handling session data in the database
 */

/**
 * Creates a new session in the database
 * @param token - The session token to hash and store
 * @param userId - The ID of the user this session belongs to
 * @returns The newly created session object
 */
export async function createSession(
  token: string,
  userId: number
): Promise<Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

  const result = await sql`
    INSERT INTO session (id, user_id, expires_at)
    VALUES (${sessionId}, ${userId}, ${expiresAt})
    RETURNING id, user_id, created_at, expires_at
  `;

  return result[0] as Session;
}

/**
 * Removes a session from the database by its ID
 * @param sessionId - The ID of the session to invalidate
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  await sql`
    DELETE FROM session
    WHERE id = ${sessionId}
  `;
}

/**
 * SESSION VALIDATION AND MANAGEMENT
 * Functions for validating and managing active sessions
 */

/**
 * Validates a session token and retrieves associated user data
 * Also handles session expiration and automatic session extension
 * @param token - The session token to validate
 * @returns Session and user data if valid, null values if invalid
 */
export async function validateSessionToken(
  token: string
): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  // Retrieve session and user data
  const result = await sql`
    SELECT 
      s.id as session_id,
      s.user_id,
      s.created_at as session_created_at,
      s.expires_at as session_expires_at,
      u.id as user_id,
      u.email,
      u.password_hash,
      u.display_name,
      u.job_title,
      u.team_id,
      u.current_season_id,
      u.role
    FROM session s
    JOIN "user" u ON s.user_id = u.id
    WHERE s.id = ${sessionId}
  `;

  if (!result || result.length === 0) {
    return { session: null, user: null };
  }

  const row = result[0];

  // Construct session and user objects from query result
  const session: Session = {
    id: row.session_id,
    user_id: row.user_id,
    created_at: new Date(row.session_created_at),
    expires_at: new Date(row.session_expires_at),
  };

  const user: User = {
    id: row.user_id,
    email: row.email,
    password_hash: row.password_hash,
    display_name: row.display_name,
    job_title: row.job_title,
    team_id: row.team_id,
    current_season_id: row.current_season_id,
    role: row.role,
  };

  // Handle expired sessions
  if (Date.now() >= session.expires_at.getTime()) {
    await invalidateSession(session.id);
    return { session: null, user: null };
  }

  // Extend session if it's within 15 days of expiring
  const fifteenDaysBeforeExpiry = session.expires_at.getTime() - 1000 * 60 * 60 * 24 * 15;
  if (Date.now() >= fifteenDaysBeforeExpiry) {
    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await sql`
      UPDATE session
      SET expires_at = ${newExpiresAt}
      WHERE id = ${session.id}
    `;
    session.expires_at = newExpiresAt;
  }

  return { session, user };
}

/**
 * COOKIE MANAGEMENT
 * Functions for handling session cookies
 */

/**
 * Sets the session token cookie
 * @param token - The session token to store in the cookie
 */
export async function setSessionTokenCookie(token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Deletes the session token cookie
 */
export async function deleteSessionTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

/**
 * SESSION LIFECYCLE
 * High-level functions for managing the complete session lifecycle
 */

/**
 * Deletes the current session and removes the session cookie
 */
export async function deleteSession() {
  const currentSession = await getCurrentSession();

  if (currentSession.session?.id) {
    await invalidateSession(currentSession.session.id);
  }

  await deleteSessionTokenCookie();
}

/**
 * Gets the current session and associated user data
 * Cached to prevent unnecessary database queries
 */
export const getCurrentSession = cache(
  async (): Promise<SessionValidationResult> => {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value ?? null;

    if (token === null) {
      return { session: null, user: null };
    }

    return validateSessionToken(token);
  }
);
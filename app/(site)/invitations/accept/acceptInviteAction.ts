"use server";

import { createSession, generateSessionToken, setSessionTokenCookie } from "@/auth/auth";
import { sql } from "@/db/db";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const AcceptInviteSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." }),
  confirmPassword: z.string(),
  token: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type AcceptInviteFormInputs = z.infer<typeof AcceptInviteSchema>;
type ActionState = { error: string; inputs?: Partial<AcceptInviteFormInputs> } | null;

const getFormValues = (formData: FormData) => ({
  password: String(formData.get("password") || ""),
  confirmPassword: String(formData.get("confirmPassword") || ""),
  token: String(formData.get("token") || "")
});

export async function acceptInviteAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const inputValues = getFormValues(formData);
  
  try {
    // Validate form inputs
    const result = AcceptInviteSchema.safeParse(inputValues);
    
    if (!result.success) {
      return {
        error: result.error.errors.map((e) => e.message).join(", "),
        inputs: inputValues,
      };
    }
    
    const data = result.data;
    
    // Find the invitation
    const invite = await sql`
      SELECT * FROM invite 
      WHERE token = ${data.token} AND status = 'Pending'
      LIMIT 1
    `;

    if (!invite || invite.length === 0) {
      return { 
        error: "Invalid or expired invitation",
        inputs: inputValues
      };
    }

    const inviteData = invite[0];

    // Check if the invitation has expired
    if (new Date(inviteData.expires_at) < new Date()) {
      return { 
        error: "This invitation has expired",
        inputs: inputValues
      };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create the user
    const newUser = await sql`
      INSERT INTO "user" (
        email,
        password_hash,
        display_name,
        job_title,
        team_id,
        current_season_id,
        role
      ) VALUES (
        ${inviteData.email},
        ${hashedPassword},
        ${inviteData.display_name},
        ${inviteData.job_title},
        ${inviteData.team_id},
        ${inviteData.current_season_id},
        ${inviteData.role}
      )
      RETURNING id, email, display_name, job_title, team_id, current_season_id, role
    `;

    if (!newUser || newUser.length === 0) {
      return { 
        error: "Failed to create user account",
        inputs: inputValues
      };
    }

    // Update the invitation status to 'Accepted'
    await sql`
      UPDATE invite
      SET status = 'Accepted'
      WHERE id = ${inviteData.id}
    `;

    // Log in the user
    const userId = newUser[0].id;
    const sessionToken = generateSessionToken();
    await createSession(sessionToken, userId);
    await setSessionTokenCookie(sessionToken);
  
  } catch (error: any) {
    return {
      error: error.message,
      inputs: inputValues
    };
  }
  
  revalidatePath("/");
  return redirect("/dashboard");
}
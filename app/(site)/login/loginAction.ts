"use server";

import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "@/auth/auth";
import { sql } from "@/db/db";
import { compare } from "bcrypt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." }),
});

type LoginFormInputs = z.infer<typeof LoginSchema>;
type ActionState = { error: string; inputs?: Partial<LoginFormInputs> } | null;

const getFormValues = (formData: FormData) => ({
  email: String(formData.get("email") || ""),
  password: String(formData.get("password") || ""),
});
export async function loginAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const inputValues = getFormValues(formData);
    const result = LoginSchema.safeParse(inputValues);

    if (!result.success) {
      return {
        error: result.error.errors.map((e) => e.message).join(", "),
        inputs: inputValues,
      };
    }

    const data = result.data;

    const [user] = await sql`
      SELECT * FROM "user"
      WHERE email = ${data.email}
    `;

    if (!user) {
      return { error: "User not found." };
    }

    const passwordMatch = await compare(data.password, user.password_hash);

    if (!passwordMatch) {
      return { error: "Invalid password." };
    }

    const token = generateSessionToken();
    await createSession(token, user.id);
    await setSessionTokenCookie(token);
  } catch (error: any) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/");
  return redirect("/dashboard");
}

"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import H1 from "@/components/H1"
import TextInput from "@/components/TextInput"
import DefaultButton from "@/components/DefaultButton"
import Alert from "@/components/Alert"
import { acceptInviteAction } from "./acceptInviteAction"

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("invite-code")
  const [state, action, isPending] = useActionState(acceptInviteAction, null)
  const [clientError, setClientError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setClientError("Invalid invitation link")
    }
  }, [token])

  const handleSubmit = async (formData: FormData) => {
    // Clear previous errors
    setClientError(null)

    // Get password values for client-side validation
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Client-side validation
    if (password !== confirmPassword) {
      setClientError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setClientError("Password must be at least 8 characters long")
      return
    }

    // Add the token to the form data
    if (token) {
      formData.append("token", token)
    }

    // Submit the form
    action(formData)
  }

  // Show error from server or client
  const error = state?.error || clientError || null

  if (error === "Invalid invitation link") {
    return (
      <div className="lg:w-3/4 lg:mx-auto">
        <H1 text="Invalid Invitation" />
        <div className="p-8 border border-gray-200 rounded-lg">
          <Alert message={error} type="error" />
        </div>
      </div>
    )
  }

  return (
    <div className="lg:w-3/4 lg:mx-auto">
      <H1 text="Accept Invitation" />

      {error && <Alert message={error} type="error" />}

      <form action={handleSubmit} className="p-8 border border-gray-200 rounded-lg">
        <div className="lg:grid lg:grid-cols-2 lg:gap-2 space-y-2 lg:space-y-0">
          <TextInput
            label="Password"
            name="password"
            type="password"
            placeholder="Set your password"
            required
            error={error?.includes('password')}
            defaultValue={state?.inputs?.password}
          />
          <TextInput
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            required
            error={error?.includes('password')}
            defaultValue={state?.inputs?.confirmPassword}
          />
        </div>
        <DefaultButton
          text={isPending ? "Processing..." : "Accept Invitation"}
          type="submit"
          className="mt-4 w-full"
          disabled={isPending}
        />
      </form>
    </div>
  )
}
"use client"

import type React from "react"

import DefaultButton from "@/components/DefaultButton"
import TextInput from "@/components/TextInput"
import { useState } from "react"
import { updateUsername } from "./userSettingsActions"

interface UpdateUsernameProps {
  currentUsername: string
}

export function UpdateUsername({ currentUsername }: UpdateUsernameProps) {
  const [username, setUsername] = useState(currentUsername)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccess(false)

    try {
      await updateUsername(username)
      setSuccess(true)
    } catch (err) {
      setError("Failed to update username")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-3" autoComplete="off" noValidate>
      <div className="space-y-2">
        <TextInput
          defaultValue={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your display name"
          required
          label={"Display Name"}
          name={"username"}
          id="username"
          autoFocus={false}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Username updated successfully!</p>}
      <DefaultButton
        text={isSubmitting ? "Updating..." : "Update Username"}
        type="submit"
        disabled={isSubmitting || username === currentUsername}
        className="w-56"
      />
    </form>
  )
}


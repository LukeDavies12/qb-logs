"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import ComboBox from "@/components/Combobox"
import DefaultButton from "@/components/DefaultButton"
import TextInput from "@/components/TextInput"
import type { PlayGroupingType } from "@/types/playGroupingTypes"
import { useActionState, useTransition } from "react"
import { createPlayGrouping } from "../manageTeamActions"

export default function AddPlayGrouping() {
  const [formError, setFormError] = useState(false)
  const [currentType, setCurrentType] = useState<PlayGroupingType | "">("")
  const [state, formAction, isPending] = useActionState(createPlayGrouping, { error: "", success: false })
  const [isPendingTransition, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0) // Key to force re-render

  // Reference to the form
  const formRef = useRef<HTMLFormElement>(null)

  // Clear form after successful submission
  useEffect(() => {
    if (state.success) {
      // Reset the form by changing the key
      setFormKey((prev) => prev + 1)
      // Reset type state
      setCurrentType("")
      setFormError(false)
    }
  }, [state.success])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const type = currentType as PlayGroupingType

    if (!name || !type) {
      setFormError(true)
      return
    }

    // Use startTransition to wrap the action call
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <form key={formKey} ref={formRef} onSubmit={handleSubmit} className="lg:flex lg:gap-2 space-y-2 lg:space-y-0 mb-2">
      <div className="lg:w-4/12">
        <TextInput label="Name" name="name" type="text" placeholder="Enter name" required error={formError} />
      </div>
      <div className="lg:w-5/12">
        <ComboBox
          label="Type"
          name="type"
          options={playGroupingTypes}
          required
          error={formError}
          value={currentType}
          onChange={(value) => setCurrentType(value as PlayGroupingType)}
        />
      </div>
      <div className="lg:w-3/12 flex flex-col justify-end">
        <input type="hidden" name="type" value={currentType} />
        <DefaultButton
          type="submit"
          text={isPending || isPendingTransition ? "Adding..." : "Add Grouping"}
          className="w-full"
          disabled={isPending || isPendingTransition}
        />
        {state.error && <p className="text-sm text-red-600 mt-1">{state.error}</p>}
      </div>
    </form>
  )
}

const playGroupingTypes: PlayGroupingType[] = [
  "Run (No QB Read)",
  "RPO",
  "Pass",
  "Screen",
  "Designed QB Run (No Reads)",
  "Designed QB Run (With Read)",
  "PRO (Pass Run Option)",
]


"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import TextInput from "@/components/TextInput"
import DefaultButton from "@/components/DefaultButton"
import CheckboxInput from "@/components/CheckboxInput"
import { useActionState, useTransition } from "react"
import { addSeasonQB } from "@/app/(app)/manage-team/manageTeamActions"
import ComboBox, { type ComboBoxRef } from "@/components/Combobox"

export default function AddSeasonQB({
  hasStarter
}: {
  hasStarter: boolean
}) {
  const [formError, setFormError] = useState(false)
  const [isStarterChecked, setIsStarterChecked] = useState(false)
  const yearRef = useRef<ComboBoxRef>({} as ComboBoxRef)
  const formRef = useRef<HTMLFormElement>(null)
  const [formKey, setFormKey] = useState(0) // Key to force re-render

  const [state, formAction, isPending] = useActionState(addSeasonQB, { error: "", success: false })
  const [isPendingTransition, startTransition] = useTransition()

  // Available years for the ComboBox
  const playerYears = [
    "Freshman",
    "Redshirt Freshman",
    "Sophomore",
    "Redshirt Sophomore",
    "Junior",
    "Redshirt Junior",
    "Senior",
    "Redshirt Senior"
  ]

  // Reset starter checkbox if there's already a starter
  useEffect(() => {
    if (hasStarter) {
      setIsStarterChecked(false)
    }
  }, [hasStarter])

  // Handle success
  useEffect(() => {
    if (state.success) {
      // Reset the form by changing the key
      setFormKey((prev) => prev + 1)
      setIsStarterChecked(false)
      setFormError(false)
    }
  }, [state.success])

  const handleAddQB = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    // Basic validation
    const name = formData.get("name") as string
    const number = formData.get("number") as string

    if (!name || !number) {
      setFormError(true)
      return
    }

    // Convert checkbox values to boolean strings
    formData.set("is_active", formData.get("is_active") ? "true" : "false")
    formData.set("is_starter", formData.get("is_starter") ? "true" : "false")

    setFormError(false)

    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <form key={formKey} ref={formRef} onSubmit={handleAddQB} className="lg:flex lg:gap-1 space-y-2 lg:space-y-0 mb-4">
      <div className="lg:w-3/12">
        <TextInput label="Name" name="name" type="text" placeholder="QB name" required error={formError} />
      </div>

      <div className="lg:w-1/12">
        <TextInput label="Number" name="number" type="number" placeholder="#" required error={formError} />
      </div>

      <div className="lg:w-3/12">
        <ComboBox ref={yearRef} label="Year" name="year" options={playerYears} required={false} error={formError} />
      </div>

      <div className="lg:w-3/12 flex items-end">
        <div className="flex items-end pb-1 gap-1 h-9">
          <CheckboxInput id="qb-is-active" name="is_active" label="Active" defaultChecked={true} />

          <CheckboxInput
            id="qb-is-starter"
            name="is_starter"
            label="Starter"
            disabled={hasStarter === true}
            defaultChecked={isStarterChecked}
            onChange={(e) => setIsStarterChecked(e.target.checked)}
          />
        </div>
      </div>

      <div className="lg:w-2/12 flex flex-col justify-end lg:ml-3">
        <DefaultButton
          type="submit"
          text={isPending || isPendingTransition ? "Adding..." : "Add QB"}
          className="w-full"
          disabled={isPending || isPendingTransition}
        />
        {state.error && <p className="text-sm text-red-600 mt-1">{state.error}</p>}
      </div>
    </form>
  )
}


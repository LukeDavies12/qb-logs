"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import TextInput from "@/components/TextInput"
import DefaultButton from "@/components/DefaultButton"
import SecondaryButton from "@/components/SecondaryButton"
import { useActionState, useTransition } from "react"
import Modal from "@/components/Modal"
import CheckboxInput from "@/components/CheckboxInput"
import type { SeasonQB } from "@/types/seasonType"

// You'll need to create this action in your actions file
import { updateSeasonQB } from "@/app/(app)/manage-team/manageTeamActions"
import ComboBox, { type ComboBoxRef } from "@/components/Combobox"

interface UpdateSeasonQBModalProps {
  isOpen: boolean
  onClose: () => void
  seasonQB: SeasonQB
  allSeasonQBs: SeasonQB[] // Need all QBs to check for existing starters
  onUpdate?: () => void
}

export default function UpdateSeasonQBModal({
  isOpen,
  onClose,
  seasonQB,
  allSeasonQBs,
  onUpdate,
}: UpdateSeasonQBModalProps) {
  const [formError, setFormError] = useState(false)
  const [starterError, setStarterError] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const yearRef = useRef<ComboBoxRef>(null)
  const [formKey, setFormKey] = useState(0)

  // Create a unique modal ID to prefix all form elements
  const modalId = `qb-modal-${seasonQB.id}`

  // Create a new action state each time
  const [state, formAction, isPending] = useActionState(updateSeasonQB, { error: "", success: false })
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
    "Redshirt Senior",
    "Graduate",
  ]
  // Reset form when modal opens with new seasonQB
  useEffect(() => {
    if (isOpen) {
      setFormKey((prev) => prev + 1)
      setFormError(false)
      setStarterError(false)
    }
  }, [isOpen])

  // Handle success
  useEffect(() => {
    if (state.success) {
      if (onUpdate) onUpdate()
      onClose()
    }
  }, [state.success, onClose, onUpdate])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const name = formData.get("name") as string
    const number = formData.get("number") as string
    const isStarter = Boolean(formData.get("is_starter"))

    // Basic validation
    if (!name.trim() || !number.trim()) {
      setFormError(true)
      return
    }

    // Check if trying to set as starter when another QB is already starter
    if (isStarter && !seasonQB.is_starter) {
      const existingStarter = allSeasonQBs.find((qb) => qb.is_starter && qb.id !== seasonQB.id)
      if (existingStarter) {
        setStarterError(true)
        return
      }
    }

    // Clear errors if validation passes
    setFormError(false)
    setStarterError(false)

    // Add ID to form data
    formData.append("id", seasonQB.id.toString())
    formData.append("team_qb_id", seasonQB.team_qb_id.toString())
    formData.append("season_id", seasonQB.season_id.toString())

    // Handle checkbox values - CheckboxInput returns "true" when checked, null when unchecked
    formData.set("is_active", formData.get("is_active") ? "true" : "false")
    formData.set("is_starter", formData.get("is_starter") ? "true" : "false")

    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Quarterback">
      <form ref={formRef} key={formKey} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <TextInput
            label="Name"
            name="name"
            id={`${modalId}-name`}
            type="text"
            defaultValue={seasonQB.name}
            placeholder="Enter quarterback name"
            required
            error={formError}
          />

          <TextInput
            label="Number"
            name="number"
            id={`${modalId}-number`}
            type="number"
            defaultValue={seasonQB.number.toString()}
            placeholder="Enter jersey number"
            required
            error={formError}
          />

          <ComboBox
            ref={yearRef}
            label="Year"
            name="year"
            id={`${modalId}-year`}
            options={playerYears}
            defaultValue={seasonQB.year}
            required={false}
            error={formError}
          />

          <div className="flex flex-col gap-2">
            <CheckboxInput
              id={`${modalId}-is_active`}
              name="is_active"
              label="Active"
              defaultChecked={seasonQB.is_active}
            />

            <CheckboxInput
              id={`${modalId}-is_starter`}
              name="is_starter"
              label="Starter"
              defaultChecked={seasonQB.is_starter}
              disabled={!seasonQB.is_starter && allSeasonQBs.some((qb) => qb.is_starter && qb.id !== seasonQB.id)}
            />

            {starterError && (
              <p className="text-xs text-red-600 mt-1">
                Another QB is already set as starter. Please unset that QB first.
              </p>
            )}
          </div>
        </div>

        {state.error && <p className="text-sm text-red-600 mt-4">{state.error}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <SecondaryButton type="button" text="Cancel" onClick={onClose} />
          <DefaultButton
            type="submit"
            text={isPending || isPendingTransition ? "Updating..." : "Update"}
            disabled={isPending || isPendingTransition}
          />
        </div>
      </form>
    </Modal>
  )
}


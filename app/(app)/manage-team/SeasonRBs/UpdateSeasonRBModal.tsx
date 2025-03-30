"use client"

import { updateSeasonRB } from "@/app/(app)/manage-team/manageTeamActions"
import CheckboxInput from "@/components/CheckboxInput"
import ComboBox, { type ComboBoxRef } from "@/components/Combobox"
import DefaultButton from "@/components/DefaultButton"
import Modal from "@/components/Modal"
import SecondaryButton from "@/components/SecondaryButton"
import TextInput from "@/components/TextInput"
import type { SeasonRB } from "@/types/seasonType"
import type React from "react"
import { useActionState, useEffect, useRef, useState, useTransition } from "react"

interface UpdateSeasonRBModalProps {
  isOpen: boolean
  onClose: () => void
  seasonRB: SeasonRB
  allSeasonRBs: SeasonRB[]
  onUpdate?: () => void
}

export default function UpdateSeasonRBModal({
  isOpen,
  onClose,
  seasonRB,
  allSeasonRBs,
  onUpdate,
}: UpdateSeasonRBModalProps) {
  const [formError, setFormError] = useState(false)
  const [starterError, setStarterError] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const yearRef = useRef<ComboBoxRef>(null)
  const [formKey, setFormKey] = useState(0)

  const modalId = `rb-modal-${seasonRB.id}`
  const [state, formAction, isPending] = useActionState(updateSeasonRB, { error: "", success: false })
  const [isPendingTransition, startTransition] = useTransition()

  const playerYears = [
    "Freshman",
    "Redshirt Freshman",
    "Sophomore",
    "Redshirt Sophomore",
    "Junior",
    "Redshirt Junior",
    "Senior",
    "Redshirt Senior",
  ]

  useEffect(() => {
    if (isOpen) {
      setFormKey((prev) => prev + 1)
      setFormError(false)
      setStarterError(false)
    }
  }, [isOpen])

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

    // Check if trying to set as starter when another RB is already starter
    if (isStarter && !seasonRB.is_starter) {
      const existingStarter = allSeasonRBs.find((rb) => rb.is_starter && rb.id !== seasonRB.id)
      if (existingStarter) {
        setStarterError(true)
        return
      }
    }

    // Clear errors if validation passes
    setFormError(false)
    setStarterError(false)

    // Add ID to form data
    formData.append("id", seasonRB.id.toString())
    formData.append("team_rb_id", seasonRB.team_rb_id.toString())
    formData.append("season_id", seasonRB.season_id.toString())

    // Handle checkbox values - CheckboxInput returns "true" when checked, null when unchecked
    formData.set("is_active", formData.get("is_active") ? "true" : "false")
    formData.set("is_starter", formData.get("is_starter") ? "true" : "false")

    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Running Back">
      <form ref={formRef} key={formKey} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <TextInput
            label="Name"
            name="name"
            id={`${modalId}-name`}
            type="text"
            defaultValue={seasonRB.name}
            placeholder="Enter running back name"
            required
            error={formError}
          />

          <TextInput
            label="Number"
            name="number"
            id={`${modalId}-number`}
            type="number"
            defaultValue={seasonRB.number.toString()}
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
            defaultValue={seasonRB.year}
            required={false}
            error={formError}
          />

          <div className="flex flex-col gap-2">
            <CheckboxInput
              id={`${modalId}-is_active`}
              name="is_active"
              label="Active"
              defaultChecked={seasonRB.is_active}
            />

            <CheckboxInput
              id={`${modalId}-is_starter`}
              name="is_starter"
              label="Starter"
              defaultChecked={seasonRB.is_starter}
              disabled={!seasonRB.is_starter && allSeasonRBs.some((rb) => rb.is_starter && rb.id !== seasonRB.id)}
            />

            {starterError && (
              <p className="text-xs text-red-600 mt-1">
                Another RB is already set as starter. Please unset that RB first.
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


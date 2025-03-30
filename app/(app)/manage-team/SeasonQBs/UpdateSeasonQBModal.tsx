"use client"

import { updateSeasonQB } from "@/app/(app)/manage-team/manageTeamActions"
import CheckboxInput from "@/components/CheckboxInput"
import ComboBox, { type ComboBoxRef } from "@/components/Combobox"
import DefaultButton from "@/components/DefaultButton"
import Modal from "@/components/Modal"
import SecondaryButton from "@/components/SecondaryButton"
import TextInput from "@/components/TextInput"
import type { SeasonQB } from "@/types/seasonType"
import type React from "react"
import { useActionState, useEffect, useRef, useState, useTransition } from "react"

interface UpdateSeasonQBModalProps {
  isOpen: boolean
  onClose: () => void
  seasonQB: SeasonQB
  allSeasonQBs: SeasonQB[]
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

  const modalId = `qb-modal-${seasonQB.id}`

  const [state, formAction, isPending] = useActionState(updateSeasonQB, { error: "", success: false })
  const [isPendingTransition, startTransition] = useTransition()

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

    if (!name.trim() || !number.trim()) {
      setFormError(true)
      return
    }

    if (isStarter && !seasonQB.is_starter) {
      const existingStarter = allSeasonQBs.find((qb) => qb.is_starter && qb.id !== seasonQB.id)
      if (existingStarter) {
        setStarterError(true)
        return
      }
    }

    setFormError(false)
    setStarterError(false)

    formData.append("id", seasonQB.id.toString())
    formData.append("team_qb_id", seasonQB.team_qb_id.toString())
    formData.append("season_id", seasonQB.season_id.toString())

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


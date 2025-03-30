"use client"

import type React from "react"

import { updatePlayGrouping } from "@/app/(app)/manage-team/manageTeamActions"
import DefaultButton from "@/components/DefaultButton"
import Modal from "@/components/Modal"
import SecondaryButton from "@/components/SecondaryButton"
import TextInput from "@/components/TextInput"
import { useActionState, useEffect, useRef, useState, useTransition } from "react"

interface UpdatePlayGroupingModalProps {
  isOpen: boolean
  onClose: () => void
  playGrouping: {
    id: number
    name: string
    type: string
  }
  onUpdate?: () => void
}

export default function UpdatePlayGroupingModal({
  isOpen,
  onClose,
  playGrouping,
  onUpdate,
}: UpdatePlayGroupingModalProps) {
  const [formError, setFormError] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [formKey, setFormKey] = useState(0)

  const [state, formAction, isPending] = useActionState(updatePlayGrouping, { error: "", success: false })
  const [isPendingTransition, startTransition] = useTransition()

  useEffect(() => {
    if (isOpen) {
      setFormKey((prev) => prev + 1)
      setFormError(false)
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

    if (!name.trim()) {
      setFormError(true)
      return
    }

    formData.append("id", playGrouping.id.toString())

    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Play Grouping">
      <form ref={formRef} key={formKey} onSubmit={handleSubmit}>
        <div className="mb-4">
          <TextInput
            label="Name"
            name="name"
            type="text"
            defaultValue={playGrouping.name}
            placeholder="Enter play grouping name"
            required
            error={formError}
          />
          <p className="mt-1 text-xs text-neutral-500">Type: {playGrouping.type}</p>
        </div>

        {state.error && <p className="text-sm text-red-600 mb-4">{state.error}</p>}

        <div className="flex justify-end gap-2">
          <SecondaryButton type="button" text="Cancel" onClick={onClose} />
          <DefaultButton
            type="submit"
            text={isPending || isPendingTransition ? "Updating..." : "Update"}
            disabled={isPending || isPendingTransition}
            className="w-28"
          />
        </div>
      </form>
    </Modal>
  )
}


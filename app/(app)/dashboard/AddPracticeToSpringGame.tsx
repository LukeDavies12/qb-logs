"use client"

import DefaultButton from "@/components/DefaultButton"
import Modal from "@/components/Modal"
import SecondaryButton from "@/components/SecondaryButton"
import TextInput from "@/components/TextInput"
import { useActionState, useEffect, useState, useTransition } from "react"
import { addPracticeToSpringSeason } from "./dashboardActions"

export default function AddPracticeToSpringSeason() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)

  const handleOpenModal = () => {
    setModalOpen(true)
    setModalKey((prev) => prev + 1)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
  }

  return (
    <>
      <SecondaryButton text="New Practice" type="button" onClick={handleOpenModal} />
      {modalOpen && <AddPracticeToSpringSeasonModal key={modalKey} isOpen={modalOpen} onClose={handleCloseModal} />}
    </>
  )
}

interface AddPracticeToSpringSeasonModalProps {
  isOpen: boolean
  onClose: () => void
}

function AddPracticeToSpringSeasonModal({ isOpen, onClose }: AddPracticeToSpringSeasonModalProps) {
  const [formError, setFormError] = useState(false)
  const [state, formAction, isPending] = useActionState(addPracticeToSpringSeason, { error: "", success: false })
  const [isPendingTransition, startTransition] = useTransition()

  // Use useEffect to handle the success state
  useEffect(() => {
    if (state.success) {
      onClose()
    }
  }, [state.success, onClose])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const date = formData.get("date") as string

    if (!date) {
      setFormError(true)
      return
    }

    setFormError(false)

    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Practice">
      <form onSubmit={handleSubmit}>
        <TextInput label="Date" name="date" id="practice-date" type="date" required error={formError} />
        {state.error && <p className="text-sm text-red-600 mt-4">{state.error}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <SecondaryButton type="button" text="Cancel" onClick={onClose} />
          <DefaultButton
            type="submit"
            text={isPending || isPendingTransition ? "Adding..." : "Add Practice"}
            disabled={isPending || isPendingTransition}
            className="w-36"
          />
        </div>
      </form>
    </Modal>
  )
}


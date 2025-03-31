"use client"

import type React from "react"
import { useActionState, useEffect, useState, useTransition } from "react"

import DefaultButton from "@/components/DefaultButton"
import Modal from "@/components/Modal"
import SecondaryButton from "@/components/SecondaryButton"
import TextInput from "@/components/TextInput"
import { addGameToFallSeason } from "./dashboardActions"

export default function AddGameToFallSeason() {
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
      <SecondaryButton text="New Game" type="button" onClick={handleOpenModal} />
      {modalOpen && <AddGameToFallSeasonModal key={modalKey} isOpen={modalOpen} onClose={handleCloseModal} />}
    </>
  )
}

interface AddGameToFallSeasonModalProps {
  isOpen: boolean
  onClose: () => void
}

function AddGameToFallSeasonModal({ isOpen, onClose }: AddGameToFallSeasonModalProps) {
  const [formError, setFormError] = useState(false)
  const [state, formAction, isPending] = useActionState(addGameToFallSeason, { error: "", success: false })
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
    const against = formData.get("against") as string

    if (!date || !against.trim()) {
      setFormError(true)
      return
    }

    setFormError(false)

    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Game">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <TextInput label="Date" name="date" id="game-date" type="date" required error={formError} />

          <TextInput
            label="Opponent"
            name="against"
            id="game-against"
            type="text"
            placeholder="Enter opponent name"
            required
            error={formError}
          />
        </div>

        {state.error && <p className="text-sm text-red-600 mt-4">{state.error}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <SecondaryButton type="button" text="Cancel" onClick={onClose} />
          <DefaultButton
            type="submit"
            text={isPending || isPendingTransition ? "Adding..." : "Add Game"}
            disabled={isPending || isPendingTransition}
            className="w-28"
          />
        </div>
      </form>
    </Modal>
  )
}


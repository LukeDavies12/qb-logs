"use client"

import DefaultButton from "@/components/DefaultButton"
import TextInput from "@/components/TextInput"
import type React from "react"
import { useRef, useState, useTransition } from "react"
import { addPracticeBlock } from "../practiceActions"

export default function AddPracticeBlock({ practiceId }: { practiceId: number }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)
  const [newBlockId, setNewBlockId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState(false)

  const resetForm = () => {
    if (formRef.current) {
      formRef.current.reset()
    }
    setNameError(false)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string

    if (!name.trim()) {
      setNameError(true)
      return
    }

    setNameError(false)
    setError(null)
    setShowSuccess(false)

    startTransition(async () => {
      try {
        formData.append("practiceId", practiceId.toString())

        const result = await addPracticeBlock({ error: "", success: false }, formData)

        if (result && result.success && result.blockId) {
          setNewBlockId(result.blockId)
          setShowSuccess(true)
          resetForm() // Use our dedicated reset function
          setTimeout(() => setShowSuccess(false), 3000)
        } else if (result && result.error) {
          setError(result.error)
        }
      } catch (err) {
        setError("Failed to add practice block. Please try again.")
        console.error(err)
      }
    })
  }

  const handleCancel = () => {
    resetForm() // Use our dedicated reset function
  }

  return (
    <div className="my-4">
      <form id="add-block-form" ref={formRef} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <TextInput
              label=""
              name="name"
              id="practice-block-name"
              type="text"
              placeholder="Name e.g. 3rd + Med 2"
              error={nameError}
              className="min-w-72"
              required
            />
            <div className="flex gap-2">
              <DefaultButton
                type="submit"
                text={isPending ? "Adding..." : "Add Block"}
                disabled={isPending}
                className="w-36"
              />
            </div>
          </div>
          {error && <span className="flex items-center text-red-600">{error}</span>}
          {showSuccess && (
            <span className="flex items-center text-green-600">
              Block added successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
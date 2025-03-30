"use client"

import { createSeason } from "@/app/(app)/manage-team/Seasons/seasonActions"
import ComboBox from "@/components/Combobox"
import DefaultButton from "@/components/DefaultButton"
import Modal from "@/components/Modal"
import SecondaryButton from "@/components/SecondaryButton"
import TextInput from "@/components/TextInput"
import { useEffect, useRef, useState, useTransition } from "react"

interface CreateSeasonModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateSeasonModal({ isOpen, onClose, onSuccess }: CreateSeasonModalProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [type, setType] = useState<"Fall" | "Spring">("Fall")
  const [formError, setFormError] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [formKey, setFormKey] = useState(0)

  const seasonTypes = ["Fall", "Spring"]
  const modalId = "create-season-modal"

  useEffect(() => {
    if (isOpen) {
      setFormKey(prev => prev + 1)
      setFormError(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const yearValue = formData.get("year") as string
    const typeValue = formData.get("type") as string
    
    if (!yearValue || !typeValue) {
      setFormError(true)
      return
    }
    
    setFormError(false)
    
    startTransition(async () => {
      try {
        await createSeason({ 
          year: parseInt(yearValue), 
          type: typeValue as "Fall" | "Spring" 
        })
        if (onSuccess) onSuccess()
        onClose()
      } catch (error) {
        console.error("Failed to create season:", error)
        setFormError(true)
      }
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Season">
      <form ref={formRef} key={formKey} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <TextInput
            label="Year"
            name="year"
            id={`${modalId}-year`}
            type="number"
            defaultValue={year.toString()}
            placeholder="Enter year"
            required
            error={formError}
          />
          
          <ComboBox
            label="Season Type"
            name="type"
            id={`${modalId}-type`}
            options={seasonTypes}
            defaultValue={type}
            required
            error={formError}
          />
        </div>
        
        {formError && (
          <p className="text-sm text-red-600 mt-4">Please fill out all required fields.</p>
        )}
        
        <div className="flex justify-end gap-2 mt-6">
          <SecondaryButton type="button" text="Cancel" onClick={onClose} />
          <DefaultButton
            type="submit"
            text={isPending ? "Creating..." : "Create Season"}
            disabled={isPending}
          />
        </div>
      </form>
    </Modal>
  )
}
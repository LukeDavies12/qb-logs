"use client"

import { useState, useTransition } from "react"
import SecondaryButton from "@/components/SecondaryButton"
import { ChevronDown, Loader2 } from "lucide-react"
import { addDriveToGame } from "../gameActions"

export default function AddDrive({ gameId }: { gameId: number }) {
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)
  const [newDriveNumber, setNewDriveNumber] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAddDrive = () => {
    setError(null)
    setShowSuccess(false)
    
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("gameId", gameId.toString())
        
        const result = await addDriveToGame(null, formData)
        
        if (result && result.success && result.driveNumber) {
          setNewDriveNumber(result.driveNumber)
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 3000)
        } else if (result && result.error) {
          setError(result.error)
        }
      } catch (err) {
        setError("Failed to add drive. Please try again.")
        console.error(err)
      }
    })
  }

  return (
    <div className="my-4">
      <div className="flex items-center gap-4">
        <SecondaryButton
          type="button"
          text="Add Drive"
          onClick={handleAddDrive}
          disabled={isPending}
        />
        
        {isPending && (
          <span className="flex items-center text-neutral-500">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating drive...
          </span>
        )}
        
        {showSuccess && (
          <span className="flex items-center text-green-600">
            Drive #{newDriveNumber} added successfully
          </span>
        )}
        
        {error && (
          <span className="flex items-center text-red-600">
            {error}
          </span>
        )}
      </div>
    </div>
  )
}
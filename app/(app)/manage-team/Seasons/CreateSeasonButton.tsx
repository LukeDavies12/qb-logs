"use client"

import CreateSeasonModal from "@/app/(app)/manage-team/Seasons/CreateSeasonModal"
import { useState } from "react"

export function CreateSeasonButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Create Season
      </button>

      <CreateSeasonModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
} 
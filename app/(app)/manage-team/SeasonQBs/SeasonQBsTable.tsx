"use client"

import { useState, useCallback } from "react"
import { MoreHorizontal } from "lucide-react"
import Dropdown from "@/components/Dropdown"
import type { SeasonQB } from "@/types/seasonType"
import { useActionState, useTransition } from "react"
import { deleteSeasonQB } from "@/app/(app)/manage-team/manageTeamActions"
import UpdateSeasonQBModal from "./UpdateSeasonQBModal"

export default function SeasonQBsTable({ seasonQBs }: { seasonQBs: SeasonQB[] }) {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSeasonQB, setSelectedSeasonQB] = useState<SeasonQB | null>(null)
  const [modalKey, setModalKey] = useState(0)
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteSeasonQB, { error: "", success: false })
  const [isPendingTransition, startTransition] = useTransition()

  // Sort seasonQBs by is_starter (starters first), then by name
  const sortedSeasonQBs = [...seasonQBs].sort((a, b) => {
    if (a.is_starter !== b.is_starter) {
      return b.is_starter ? 1 : -1
    }
    return a.name.localeCompare(b.name)
  })

  // Calculate total count
  const totalCount = seasonQBs.length

  const handleUpdate = useCallback((seasonQB: SeasonQB) => {
    setSelectedSeasonQB(seasonQB)
    setIsModalOpen(true)
    // Increment modal key to force a fresh instance
    setModalKey((prev) => prev + 1)
  }, [])

  const handleDelete = (seasonQB: SeasonQB) => {
    if (window.confirm(`Are you sure you want to delete "${seasonQB.name}"?`)) {
      const formData = new FormData()
      formData.append("id", seasonQB.id.toString())

      startTransition(() => {
        deleteAction(formData)
      })
    }
  }

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Scrollable content area */}
      <div className="flex-grow overflow-y-auto">
        <div className="px-2 space-y-2 pb-2">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-neutral-700 uppercase tracking-wider py-2 border-b border-neutral-100">
            <div className="col-span-5">Name</div>
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-3">Year</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table rows */}
          {sortedSeasonQBs.map((seasonQB) => (
            <div
              key={seasonQB.id}
              className="grid grid-cols-12 gap-2 items-center py-2 px-1 rounded-md hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
              onMouseEnter={() => setHoveredItem(seasonQB.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="col-span-5 font-normal text-neutral-800 flex items-center gap-2">
                {seasonQB.name}
                {seasonQB.is_starter && (
                  <span className="text-xs text-neutral-300 rounded-full bg-neutral-800 px-1.5 py-0.5">S</span>
                )}
              </div>
              <div className="col-span-1 text-center text-neutral-700">{seasonQB.number}</div>
              <div className="col-span-3 text-neutral-700">{seasonQB.year}</div>
              <div className="col-span-2">
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 ${
                    seasonQB.is_active ? "bg-neutral-100 text-neutral-700" : "bg-neutral-50 text-neutral-500"
                  }`}
                >
                  {seasonQB.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <Dropdown
                  trigger={
                    <button
                      className={`p-1 rounded-full ${hoveredItem === seasonQB.id ? "text-neutral-600" : "text-neutral-300"}`}
                      aria-label="More options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  }
                  items={[
                    {
                      label: "Edit",
                      onClick: () => handleUpdate(seasonQB),
                    },
                    {
                      label: "Delete",
                      onClick: () => handleDelete(seasonQB),
                      className: "text-red-600 hover:bg-red-50",
                    },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error message */}
      {deleteState.error && (
        <div className="px-2 py-2 bg-red-50 border-t border-red-100">
          <p className="text-sm text-red-600">{deleteState.error}</p>
        </div>
      )}

      {/* Footer that stays at the bottom */}
      <div className="flex-shrink-0 py-1.5 border-t border-neutral-100 bg-white flex justify-end px-2 sticky bottom-0">
        <div className="text-xs font-medium text-neutral-600 rounded-full bg-neutral-100 px-2 py-0.5">
          {totalCount} total
        </div>
      </div>

      {/* Update Modal */}
      {selectedSeasonQB && (
        <UpdateSeasonQBModal
          key={modalKey}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          seasonQB={selectedSeasonQB}
          allSeasonQBs={seasonQBs}
          onUpdate={() => {
            // You would typically refresh data here
            console.log("QB updated")
          }}
        />
      )}
    </div>
  )
}


"use client"

import type { PlayGrouping } from "@/types/playGroupingTypes"
import { MoreHorizontal } from "lucide-react"
import { useState, useCallback } from "react"
import { useActionState, useTransition } from "react"
import { deletePlayGrouping } from "@/app/(app)/manage-team/manageTeamActions"
import Dropdown from "@/components/Dropdown"
import UpdatePlayGroupingModal from "./UpdatePlayGroupingModal"

export default function PlayGroupingsTable({ playGroupings }: { playGroupings: PlayGrouping[] }) {
  // Sort playGroupings by type in descending order
  const sortedPlayGroupings = [...playGroupings].sort((a, b) => b.type.localeCompare(a.type))

  // Group playGroupings by type
  const groupedPlayGroupings = sortedPlayGroupings.reduce(
    (acc, playGrouping) => {
      if (!acc[playGrouping.type]) {
        acc[playGrouping.type] = []
      }
      acc[playGrouping.type].push(playGrouping)
      return acc
    },
    {} as Record<string, PlayGrouping[]>,
  )

  // Calculate total count
  const totalCount = playGroupings.length

  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlayGrouping, setSelectedPlayGrouping] = useState<PlayGrouping | null>(null)
  const [state, formAction, isPending] = useActionState(deletePlayGrouping, { error: "", success: false })
  const [isPendingTransition, startTransition] = useTransition()
  const [modalKey, setModalKey] = useState(0)

  const handleUpdate = useCallback((playGrouping: PlayGrouping) => {
    setSelectedPlayGrouping(playGrouping)
    setIsModalOpen(true)
    // Increment modal key to force a fresh instance
    setModalKey((prev) => prev + 1)
  }, [])

  const handleDelete = (playGrouping: PlayGrouping) => {
    if (window.confirm(`Are you sure you want to delete "${playGrouping.name}"?`)) {
      const formData = new FormData()
      formData.append("id", playGrouping.id.toString())

      startTransition(() => {
        formAction(formData)
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
          {Object.entries(groupedPlayGroupings).map(([type, group]) => (
            <div key={type}>
              <div className="text-xs font-medium text-neutral-700 uppercase tracking-wider py-1 flex gap-2 items-center">
                <span>{type}</span>
                <span className="text-xs text-neutral-600 rounded-full bg-neutral-50 px-1.5 py-0.5">
                  {group.length}
                </span>
              </div>

              {group.map((playGrouping) => (
                <div
                  key={playGrouping.id}
                  className="flex items-center justify-between py-0.5 px-1 rounded-md hover:bg-neutral-50 transition-colors"
                  onMouseEnter={() => setHoveredItem(playGrouping.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="font-normal text-neutral-800">{playGrouping.name}</div>
                  <Dropdown
                    trigger={
                      <button
                        className={`p-1 rounded-full ${hoveredItem === playGrouping.id ? "text-neutral-600" : "text-neutral-300"}`}
                        aria-label="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    }
                    items={[
                      {
                        label: "Edit",
                        onClick: () => handleUpdate(playGrouping),
                      },
                      {
                        label: "Delete",
                        onClick: () => handleDelete(playGrouping),
                        className: "text-red-600 hover:bg-red-50",
                      },
                    ]}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer that stays at the bottom */}
      <div className="flex-shrink-0 py-1.5 border-t border-neutral-100 bg-white flex justify-end px-2 sticky bottom-0">
        <div className="text-xs font-medium text-neutral-600 rounded-full bg-neutral-100 px-2 py-0.5">
          {totalCount} total
        </div>
      </div>

      {/* Update Modal */}
      {selectedPlayGrouping && (
        <UpdatePlayGroupingModal
          key={modalKey}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          playGrouping={selectedPlayGrouping}
        />
      )}
    </div>
  )
}


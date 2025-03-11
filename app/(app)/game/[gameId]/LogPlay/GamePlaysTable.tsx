"use client"

import { useState, useMemo, useCallback, useTransition, useEffect } from "react"
import { ChevronDown, ChevronUp, MoreHorizontal, Filter, X, Trash2 } from "lucide-react"
import React from "react"
import { type GameDrive, type GamePlay, playExeuctionLevelsConst } from "@/types/gameTypes"
import { getReadableFieldName, getVisibleFields } from "@/types/fieldVisibilityConfig"
import { evaluatePlay } from "@/components/evaluatePlay"
import ComboBoxFilter from "@/components/ComboboxFilter"
import type { PlayGrouping } from "@/types/playGroupingTypes"
import type { TagOption } from "@/components/MultiTagSelect"
import Dropdown from "@/components/Dropdown"
import FullScreenModal from "@/components/FullScreenModal"
import UpdatePlayForm from "./UpdateGamePlay"
import type { SeasonQB, SeasonRB } from "@/types/seasonType"
import { deletePlay, deleteDrive } from "../gameActions"

interface GamePlaysTableProps {
  drives: GameDrive[]
  playGroupings?: PlayGrouping[]
  tags?: TagOption[]
  playCalls?: string[]
  seasonQBs: SeasonQB[]
  seasonRBs: SeasonRB[]
  gameId: number
}

export default function GamePlaysTable({
  drives,
  playGroupings = [],
  tags = [],
  playCalls = [],
  seasonQBs,
  seasonRBs,
  gameId,
}: GamePlaysTableProps) {
  const [expandedDrives, setExpandedDrives] = useState<Set<number>>(new Set())
  const [expandedPlays, setExpandedPlays] = useState<Set<number>>(new Set())
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [hoveredDrive, setHoveredDrive] = useState<number | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlay, setSelectedPlay] = useState<GamePlay | null>(null)
  const [modalKey, setModalKey] = useState(0)

  const [selectedDrives, setSelectedDrives] = useState<string[]>([])
  const [selectedPlayGroupings, setSelectedPlayGroupings] = useState<string[]>([])
  const [selectedPlayCalls, setSelectedPlayCalls] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Add effect to handle successful updates
  const [successMessageTimer, setSuccessMessageTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if the form was successfully submitted
    const updateForm = document.querySelector("form")
    if (updateForm) {
      const successMessage = updateForm.querySelector(".text-green-600")
      if (successMessage) {
        // Clear any existing timer
        if (successMessageTimer) {
          clearTimeout(successMessageTimer)
        }

        // Set a new timer to close the modal after 150ms
        const timer = setTimeout(() => {
          setIsModalOpen(false)
        }, 150)

        setSuccessMessageTimer(timer)

        return () => {
          if (timer) clearTimeout(timer)
        }
      }
    }
  }, [isModalOpen])

  const sortedDrives = useMemo(() => [...drives].sort((a, b) => a.number_in_game - b.number_in_game), [drives])

  const driveOptions = useMemo(
    () => Array.from(new Set(sortedDrives.map((drive) => `Drive #${drive.number_in_game}`))),
    [sortedDrives],
  )

  const playGroupingOptions = useMemo(() => {
    if (playGroupings.length > 0) {
      return playGroupings.map((pg) => pg.name)
    }

    const groupings = new Set<string>()
    sortedDrives.forEach((drive) => {
      if (!drive.Plays) return
      drive.Plays.forEach((play: GamePlay) => {
        if (play.play_grouping_type?.name) {
          groupings.add(play.play_grouping_type.name)
        }
      })
    })
    return Array.from(groupings)
  }, [sortedDrives, playGroupings])

  const playCallOptions = useMemo(() => {
    if (playCalls.length > 0) {
      return playCalls
    }

    const calls = new Set<string>()
    sortedDrives.forEach((drive) => {
      if (!drive.Plays) return
      drive.Plays.forEach((play: any) => {
        if (play.play_call) {
          calls.add(play.play_call)
        }
      })
    })
    return Array.from(calls)
  }, [sortedDrives, playCalls])

  const tagOptions = useMemo(() => {
    if (tags.length > 0) {
      return tags.map((tag) => tag.name)
    }

    const extractedTags = new Set<string>()
    sortedDrives.forEach((drive) => {
      if (!drive.Plays) return
      drive.Plays.forEach((play: GamePlay) => {
        if (play.tags && Array.isArray(play.tags)) {
          play.tags.forEach((tag) => extractedTags.add(tag.name))
        }
      })
    })
    return Array.from(extractedTags)
  }, [sortedDrives, tags])

  React.useEffect(() => {
    if (drives.length > 0) {
      const allDriveIds = new Set(drives.map((drive) => drive.id))
      setExpandedDrives(allDriveIds)
    }
  }, [drives])

  const filteredDrives = useMemo(() => {
    if (
      selectedDrives.length === 0 &&
      selectedPlayGroupings.length === 0 &&
      selectedPlayCalls.length === 0 &&
      selectedTags.length === 0
    ) {
      return sortedDrives
    }

    return sortedDrives.filter((drive) => {
      if (selectedDrives.length > 0 && !selectedDrives.includes(`Drive #${drive.number_in_game}`)) {
        return false
      }

      if (!drive.Plays || drive.Plays.length === 0) {
        return selectedPlayGroupings.length === 0 && selectedPlayCalls.length === 0 && selectedTags.length === 0
      }

      const hasMatchingPlays = drive.Plays.some((play: GamePlay) => {
        if (selectedPlayGroupings.length > 0 && !selectedPlayGroupings.includes(play.play_grouping_type?.name ?? "")) {
          return false
        }

        if (selectedPlayCalls.length > 0 && !selectedPlayCalls.includes(play.play_call)) {
          return false
        }

        if (selectedTags.length > 0) {
          // If the play has no tags or the tags array is empty, filter it out
          if (!play.tags || play.tags.length === 0) {
            return false
          }

          // Get all tag names from the play
          const playTagNames = play.tags.map((tag) => tag.name)

          // Check if any selected tag exists in the play's tags
          const hasMatchingTag = selectedTags.some((selectedTag) => playTagNames.includes(selectedTag))

          if (!hasMatchingTag) {
            return false
          }
        }

        return true
      })

      return (
        hasMatchingPlays ||
        (selectedPlayGroupings.length === 0 && selectedPlayCalls.length === 0 && selectedTags.length === 0)
      )
    })
  }, [sortedDrives, selectedDrives, selectedPlayGroupings, selectedPlayCalls, selectedTags])

  const getFilteredPlays = (drive: GameDrive) => {
    if (!drive.Plays || drive.Plays.length === 0) {
      return []
    }

    return drive.Plays.filter((play: GamePlay) => {
      if (
        selectedPlayGroupings.length > 0 &&
        !selectedPlayGroupings.includes(play.play_grouping_type?.name as string)
      ) {
        return false
      }

      if (selectedPlayCalls.length > 0 && !selectedPlayCalls.includes(play.play_call)) {
        return false
      }

      if (selectedTags.length > 0) {
        // If the play has no tags or the tags array is empty, filter it out
        if (!play.tags || play.tags.length === 0) {
          return false
        }

        // Get all tag names from the play
        const playTagNames = play.tags.map((tag) => tag.name)

        // Check if any selected tag exists in the play's tags
        const hasMatchingTag = selectedTags.some((selectedTag) => playTagNames.includes(selectedTag))

        if (!hasMatchingTag) {
          return false
        }
      }

      return true
    })
  }

  const toggleDriveDetails = (driveId: number) => {
    setExpandedDrives((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(driveId)) {
        newSet.delete(driveId)
      } else {
        newSet.add(driveId)
      }
      return newSet
    })
  }

  const togglePlayDetails = (playId: number) => {
    setExpandedPlays((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(playId)) {
        newSet.delete(playId)
      } else {
        newSet.add(playId)
      }
      return newSet
    })
  }

  const handleUpdate = useCallback((gamePlay: GamePlay) => {
    setIsModalOpen(true)
    setSelectedPlay(gamePlay)
    setModalKey((prev) => prev + 1)
  }, [])

  const handleDeletePlay = useCallback(
    (gamePlay: GamePlay) => {
      if (window.confirm(`Are you sure you want to delete play #${gamePlay.film_number}?`)) {
        startTransition(async () => {
          try {
            const result = await deletePlay(gamePlay.id, gameId)
            if (!result.success) {
              alert(`Failed to delete play: ${result.error || "Unknown error"}`)
            }
          } catch (error) {
            console.error("Error deleting play:", error)
            alert("An error occurred while deleting the play")
          }
        })
      }
    },
    [gameId],
  )

  const handleDeleteDrive = useCallback(
    (drive: GameDrive) => {
      if (
        window.confirm(
          `Are you sure you want to delete Drive #${drive.number_in_game}? This will delete all plays in this drive.`,
        )
      ) {
        startTransition(async () => {
          try {
            const result = await deleteDrive(drive.id, gameId)
            if (!result.success) {
              alert(`Failed to delete drive: ${result.error || "Unknown error"}`)
            }
          } catch (error) {
            console.error("Error deleting drive:", error)
            alert("An error occurred while deleting the drive")
          }
        })
      }
    },
    [gameId],
  )

  const clearAllFilters = () => {
    setSelectedDrives([])
    setSelectedPlayGroupings([])
    setSelectedPlayCalls([])
    setSelectedTags([])
  }

  const hasActiveFilters =
    selectedDrives.length > 0 ||
    selectedPlayGroupings.length > 0 ||
    selectedPlayCalls.length > 0 ||
    selectedTags.length > 0

  return (
    <div className="mt-2 px-2">
      <div>
        <div className="flex justify-between items-center">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-neutral-700 text-white rounded-full">
                {selectedDrives.length + selectedPlayGroupings.length + selectedPlayCalls.length + selectedTags.length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all filters
            </button>
          )}
        </div>
        {isFilterOpen && (
          <div className="bg-white mt-2 rounded-md mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <ComboBoxFilter
                label="Drives"
                name="filteredDrives"
                options={driveOptions}
                selectedValues={selectedDrives}
                onChange={setSelectedDrives}
              />
              <ComboBoxFilter
                label="Play Groupings"
                name="filteredPlayGroupings"
                options={playGroupingOptions}
                selectedValues={selectedPlayGroupings}
                onChange={setSelectedPlayGroupings}
              />
              <ComboBoxFilter
                label="Tags"
                name="filteredTags"
                options={tagOptions}
                selectedValues={selectedTags}
                onChange={setSelectedTags}
              />
              <ComboBoxFilter
                label="Play Calls"
                name="filteredPlayCalls"
                options={playCallOptions}
                selectedValues={selectedPlayCalls}
                onChange={setSelectedPlayCalls}
              />
            </div>
          </div>
        )}
      </div>
      <div className="h-full flex flex-col mt-2">
        <div className="flex-grow">
          <div className="space-y-2 pb-1">
            {filteredDrives.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 bg-neutral-50 rounded-md">
                No plays match the selected filters
              </div>
            ) : (
              filteredDrives.map((drive) => {
                const filteredPlays = getFilteredPlays(drive)
                const hasPlays = drive.Plays && drive.Plays.length > 0

                return (
                  <div
                    key={drive.id}
                    className="mb-3"
                    onMouseEnter={() => setHoveredDrive(drive.id)}
                    onMouseLeave={() => setHoveredDrive(null)}
                  >
                    <div className="text-xs font-medium text-neutral-700 uppercase tracking-wider py-1 flex gap-2 items-center">
                      <span>Drive #{drive.number_in_game}</span>
                      <span className="text-xs text-neutral-600 rounded-full bg-neutral-50 px-1.5 py-0.5">
                        {hasPlays ? filteredPlays.length : 0} plays
                      </span>
                      <div className="flex items-center ml-auto">
                        {hoveredDrive === drive.id && (
                          <button
                            onClick={() => handleDeleteDrive(drive)}
                            className="p-1 text-red-400 hover:text-red-600 mr-1"
                            title="Delete drive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleDriveDetails(drive.id)}
                          className="p-1 text-neutral-400 hover:text-neutral-600"
                        >
                          {expandedDrives.has(drive.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    {expandedDrives.has(drive.id) && hasPlays && filteredPlays.length > 0 && (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-100">
                            <th className="text-left px-2 py-1 text-sm font-medium text-neutral-500">QB</th>
                            <th className="text-left px-2 py-1 text-sm font-medium text-neutral-500">Grade</th>
                            <th className="text-right px-2 py-1 text-sm font-medium text-neutral-500">Hudl #</th>
                            <th className="text-right px-2 py-1 text-sm font-medium text-neutral-500">At</th>
                            <th className="text-right px-2 py-1 text-sm font-medium text-neutral-500">Dn</th>
                            <th className="text-right px-2 py-1 text-sm font-medium text-neutral-500">Dist</th>
                            <th className="text-left px-2 py-1 text-sm font-medium text-neutral-500">Call</th>
                            <th className="text-left px-2 py-1 text-sm font-medium text-neutral-500">Grouping</th>
                            <th className="text-left px-2 py-1 text-sm font-medium text-neutral-500">Result</th>
                            <th className="text-right px-2 py-1 text-sm font-medium text-neutral-500">Yds</th>
                            <th className="w-16"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPlays.map((play: GamePlay) => (
                            <React.Fragment key={play.id}>
                              <tr
                                className="border-b border-neutral-50 hover:bg-neutral-50/50"
                                onMouseEnter={() => setHoveredItem(play.id)}
                                onMouseLeave={() => setHoveredItem(null)}
                              >
                                <td className="px-2 py-1 text-sm">#{play.qb_in?.number}</td>
                                <td className="px-2 py-1">
                                  {(() => {
                                    const evaluation = evaluatePlay(play)
                                    if (!evaluation) return <span className="text-sm text-neutral-400">...</span>
                                    const { involved, executed } = evaluation

                                    return (
                                      <span
                                        className={`text-sm px-1.5 py-0.5 ${involved
                                          ? executed
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                          : "bg-neutral-100 text-neutral-500"
                                          }`}
                                      >
                                        {involved ? (executed ? "Y" : "N") : "-"}
                                      </span>
                                    )
                                  })()}
                                </td>
                                <td className="px-2 py-1 text-sm text-right">{play.film_number}</td>
                                <td className="px-2 py-1 text-sm text-right">{play.yard_line}</td>
                                <td className="px-2 py-1 text-sm text-right">{play.down}</td>
                                <td className="px-2 py-1 text-sm text-right">{play.distance}</td>
                                <td className="px-2 py-1 text-sm">{play.play_call}</td>
                                <td className="px-2 py-1 text-sm">{play.play_grouping_type?.name}</td>
                                <td className="px-2 py-1">
                                  <span
                                    className={`text-sm px-1.5 py-0.5 ${String(play.result).includes("TD") ? "bg-blue-100 text-blue-700" : ""
                                      }`}
                                  >
                                    {play.result}
                                  </span>
                                </td>
                                <td className="px-2 py-1 text-right">
                                  <span
                                    className={`text-sm px-1.5 py-0.5 ${play.yards_gained <= 0
                                      ? "bg-red-50 text-red-700"
                                      : play.yards_gained <= 3
                                        ? "bg-neutral-50 text-neutral-700"
                                        : play.yards_gained <= 10
                                          ? "bg-green-50 text-green-700"
                                          : play.yards_gained <= 25
                                            ? "bg-purple-50 text-purple-700"
                                            : "bg-blue-100 text-blue-700"
                                      }`}
                                  >
                                    {play.yards_gained}
                                  </span>
                                </td>
                                <td className="px-2 py-1">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => togglePlayDetails(play.id)}
                                      className="p-1 text-neutral-400 hover:text-neutral-600"
                                    >
                                      {expandedPlays.has(play.id) ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                    <Dropdown
                                      trigger={
                                        <button
                                          className={`p-1 rounded-full ${hoveredItem === play.id ? "text-neutral-600" : "text-neutral-300"}`}
                                          aria-label="More options"
                                        >
                                          <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                      }
                                      items={[
                                        {
                                          label: "Edit",
                                          onClick: () => handleUpdate(play),
                                        },
                                        {
                                          label: "Delete",
                                          onClick: () => handleDeletePlay(play),
                                          className: "text-red-600 hover:bg-red-50",
                                        },
                                      ]}
                                    />
                                  </div>
                                </td>
                              </tr>
                              {expandedPlays.has(play.id) && (
                                <tr>
                                  <td colSpan={11} className="p-0 border border-neutral-200">
                                    <div className="p-3 border-b border-neutral-50 bg-neutral-50/50 text-xs">
                                      <div className="space-y-2 lg:space-y-0 grid grid-cols-2 gap-2 lg:grid-cols-6">
                                        <div>
                                          <span className="font-medium text-neutral-700">QB: </span>
                                          <span>
                                            #{play.qb_in?.number} {play.qb_in?.name}
                                          </span>
                                        </div>
                                        {play.rb_carry && (
                                          <div>
                                            <span className="font-medium text-neutral-700">RB: </span>
                                            <span>
                                              #{play.rb_carry.number} {play.rb_carry.name}
                                            </span>
                                          </div>
                                        )}
                                        <div>
                                          <span className="font-medium text-neutral-700">Play Type: </span>
                                          <span>{play.play_grouping_type?.type}</span>
                                        </div>
                                        {play.play_grouping_type &&
                                          getVisibleFields(play.play_grouping_type.type, play.result)
                                            .filter((field) => field !== "rb_in")
                                            .map((field) => (
                                              <div key={field}>
                                                <span className="font-medium text-neutral-700">
                                                  {getReadableFieldName(field)}:
                                                </span>
                                                <span>
                                                  {typeof (play as any)[field] === "boolean" ? (
                                                    <span className="ml-1.5">
                                                      {(play as any)[field] ? "Yes" : "No"}
                                                    </span>
                                                  ) : (
                                                    <span
                                                      className={`border-l-4 pl-1 ml-1 ${(play as any)[field] === "Best"
                                                        ? "border-purple-500"
                                                        : (play as any)[field] === "Good"
                                                          ? "border-green-700"
                                                          : (play as any)[field] === "Poor"
                                                            ? "border-yellow-500"
                                                            : (play as any)[field] === "Very Poor"
                                                              ? "border-red-500"
                                                              : ""
                                                        }`}
                                                    >
                                                      {playExeuctionLevelsConst[(play as any)[field]] ||
                                                        (play as any)[field]}
                                                    </span>
                                                  )}
                                                </span>
                                              </div>
                                            ))}
                                      </div>
                                      {play.notes && (
                                        <div className="mt-2">
                                          <span className="text-neutral-500 uppercase">Notes</span>
                                          <p className="mt-1">{play.notes}</p>
                                        </div>
                                      )}
                                      {play.tags && play.tags.length > 0 && (
                                        <div className="mt-2">
                                          <span className="text-neutral-500 uppercase">Tags</span>
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            {play.tags.map((tag) => (
                                              <span
                                                key={tag.name}
                                                className="px-2 py-1 text-xs bg-neutral-200 text-neutral-800 rounded"
                                              >
                                                {tag.name}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {expandedDrives.has(drive.id) && (!hasPlays || filteredPlays.length === 0) && (
                      <div className="p-4 text-center text-neutral-500 bg-neutral-50/50">
                        {!hasPlays
                          ? "No plays have been added to this drive yet"
                          : "No plays match the selected filters in this drive"}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
        <div className="flex-shrink-0 py-1.5 border-t border-neutral-100 bg-white flex justify-end px-2 sticky bottom-0">
          <div className="text-xs font-medium text-neutral-600 rounded-full bg-neutral-100 px-2 py-0.5">
            {sortedDrives.reduce((total, drive) => {
              return total + (drive.Plays?.length || 0)
            }, 0)}{" "}
            total plays
          </div>
        </div>
      </div>
      {isModalOpen && selectedPlay && (
        <FullScreenModal
          key={modalKey}
          title={`Edit Play #${selectedPlay.film_number}`}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="p-2">
            <UpdatePlayForm
              play={selectedPlay}
              seasonQBs={seasonQBs}
              seasonRBs={seasonRBs}
              playGroupings={playGroupings}
              gameId={gameId}
              tags={tags}
              driveNum={selectedPlay.drive_number_in_game as number}
              setIsModalOpen={setIsModalOpen}
            />
          </div>
        </FullScreenModal>
      )}
    </div>
  )
}


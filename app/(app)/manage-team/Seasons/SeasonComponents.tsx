"use client"

import type React from "react"

import { Check } from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"

import { createSeason, fetchPreviousSeasonPlayers } from "@/app/(app)/manage-team/Seasons/seasonActions"
import Accordian from "@/components/Accordian"
import CheckboxInput from "@/components/CheckboxInput"
import ComboBox from "@/components/Combobox"
import DefaultButton from "@/components/DefaultButton"
import TextInput from "@/components/TextInput"
import type { Season } from "@/types/seasonType"

interface Player {
  id: number
  name: string
  year: string
  position: "QB" | "RB"
  number?: number
  is_active?: boolean
  is_starter?: boolean
}

interface NewPlayer {
  name: string
  year: string
  position: "QB" | "RB"
  number: number
  is_active: boolean
  is_starter: boolean
}

const playerYears = [
  "Freshman",
  "Redshirt Freshman",
  "Sophomore",
  "Redshirt Sophomore",
  "Junior",
  "Redshirt Junior",
  "Senior",
  "Redshirt Senior",
]

export function AddSeason() {
  const [formError, setFormError] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [previousPlayers, setPreviousPlayers] = useState<{ qbs: Player[]; rbs: Player[] }>({ qbs: [], rbs: [] })
  const [selectedQBs, setSelectedQBs] = useState<Set<number>>(new Set())
  const [selectedRBs, setSelectedRBs] = useState<Set<number>>(new Set())
  const [newQBs, setNewQBs] = useState<NewPlayer[]>([])
  const [newRBs, setNewRBs] = useState<NewPlayer[]>([])
  const [isAddingQB, setIsAddingQB] = useState(false)
  const [isAddingRB, setIsAddingRB] = useState(false)
  const [newQBName, setNewQBName] = useState("")
  const [newQBNumber, setNewQBNumber] = useState("")
  const [newQBYear, setNewQBYear] = useState("")
  const [newRBName, setNewRBName] = useState("")
  const [newRBNumber, setNewRBNumber] = useState("")
  const [newRBYear, setNewRBYear] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const seasonTypes = ["Fall", "Spring"]

  useEffect(() => {
    const loadPreviousPlayers = async () => {
      try {
        setIsLoading(true)
        const players = await fetchPreviousSeasonPlayers()
        setPreviousPlayers(players)
      } catch (error) {
        console.error("Failed to load previous players:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreviousPlayers()
  }, [])

  const handleAddSeason = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const yearValue = formData.get("year") as string
    const typeValue = formData.get("type") as string

    if (!yearValue || !typeValue) {
      setFormError(true)
      return
    }

    setFormError(false)

    const carryoverQBs = previousPlayers.qbs
      .filter((qb) => selectedQBs.has(qb.id))
      .map((qb) => ({
        id: qb.id,
        name: qb.name,
        year: getNextYear(qb.year),
        number: qb.number,
        is_active: qb.is_active ?? true,
        is_starter: qb.is_starter ?? false,
      }))

    const carryoverRBs = previousPlayers.rbs
      .filter((rb) => selectedRBs.has(rb.id))
      .map((rb) => ({
        id: rb.id,
        name: rb.name,
        year: getNextYear(rb.year),
        number: rb.number,
        is_active: rb.is_active ?? true,
        is_starter: rb.is_starter ?? false,
      }))

    startTransition(async () => {
      try {
        await createSeason({
          year: Number.parseInt(yearValue),
          type: typeValue as "Fall" | "Spring",
          carryoverQBs,
          carryoverRBs,
          newQBs,
          newRBs,
        })
        setFormKey((prev) => prev + 1)
        if (formRef.current) formRef.current.reset()
        setSelectedQBs(new Set())
        setSelectedRBs(new Set())
        setNewQBs([])
        setNewRBs([])
        window.location.reload()
      } catch (error) {
        console.error("Failed to create season:", error)
        setFormError(true)
      }
    })
  }

  const toggleQB = (id: number) => {
    setSelectedQBs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleRB = (id: number) => {
    setSelectedRBs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAddNewQB = () => {
    if (!newQBName || !newQBNumber || !newQBYear) {
      return
    }

    const newQB: NewPlayer = {
      name: newQBName,
      number: Number.parseInt(newQBNumber),
      year: newQBYear,
      position: "QB",
      is_active: true,
      is_starter: false,
    }

    setNewQBs([...newQBs, newQB])
    setNewQBName("")
    setNewQBNumber("")
    setNewQBYear("Freshman")
    setIsAddingQB(false)
  }

  const handleAddNewRB = () => {
    if (!newRBName || !newRBNumber || !newRBYear) {
      return
    }

    const newRB: NewPlayer = {
      name: newRBName,
      number: Number.parseInt(newRBNumber),
      year: newRBYear,
      position: "RB",
      is_active: true,
      is_starter: false,
    }

    setNewRBs([...newRBs, newRB])
    setNewRBName("")
    setNewRBNumber("")
    setNewRBYear("Freshman")
    setIsAddingRB(false)
  }

  const removeNewQB = (index: number) => {
    setNewQBs(newQBs.filter((_, i) => i !== index))
  }

  const removeNewRB = (index: number) => {
    setNewRBs(newRBs.filter((_, i) => i !== index))
  }

  const getYearDropdownItems = (currentYear: string, setYear: (year: string) => void) => {
    return playerYears.map((year) => ({
      label: year,
      onClick: () => setYear(year),
      icon: year === currentYear ? <Check className="h-4 w-4" /> : null,
    }))
  }

  return (
    <div className="mb-2">
      <Accordian title="New Season" contentClassName="p-2">
        <form key={formKey} ref={formRef} onSubmit={handleAddSeason} className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <TextInput
                label="Year"
                name="year"
                id="year"
                type="number"
                defaultValue={new Date().getFullYear().toString()}
                placeholder="Enter year"
                required
                error={formError}
              />
            </div>
            <div className="md:col-span-6">
              <ComboBox label="Season Type" name="type" id="type" options={seasonTypes} required error={formError} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <h3 className="text-xs cursor-default">Quarterbacks</h3>
              {isLoading ? (
                <div className="p-4 border rounded-md bg-neutral-50">
                  <p className="text-sm text-gray-500">Loading previous players...</p>
                </div>
              ) : (
                <>
                  {previousPlayers.qbs.length > 0 && (
                    <Accordian
                      title={`Previous Season QBs`}
                      titleClassName="text-sm font-medium"
                      contentClassName="p-3"
                    >
                      <div className="space-y-2 mt-2">
                        {previousPlayers.qbs.map((qb) => (
                          <div
                            key={qb.id}
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-neutral-50"
                          >
                            <div className="flex items-center space-x-3">
                              <CheckboxInput
                                id={`qb-${qb.id}`}
                                name={`qb-${qb.id}`}
                                label=""
                                defaultChecked={selectedQBs.has(qb.id)}
                                onChange={() => toggleQB(qb.id)}
                              />
                              <div>
                                <p className="text-sm font-medium">
                                  {qb.name} <span className="text-gray-500">#{qb.number}</span>
                                </p>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">{qb.year}</span>
                                  <span className="text-xs text-gray-500">→</span>
                                  <span className="text-xs font-semibold text-neutral-900">{getNextYear(qb.year)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Accordian>
                  )}
                  <div className="border rounded-md p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">New QBs</h4>
                      {!isAddingQB && (
                        <button
                          type="button"
                          onClick={() => setIsAddingQB(true)}
                          className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-md"
                        >
                          Add QB
                        </button>
                      )}
                    </div>
                    {isAddingQB && (
                      <div className="space-y-3 rounded-md">
                        <div className="grid grid-cols-2 gap-3">
                          <TextInput
                            label="Name"
                            defaultValue={newQBName}
                            onChange={(e) => setNewQBName(e.target.value)}
                            placeholder="QB Name"
                            name=""
                          />
                          <TextInput
                            label="Number"
                            defaultValue={newQBNumber}
                            onChange={(e) => setNewQBNumber(e.target.value)}
                            type="number"
                            placeholder="#"
                            name=""
                          />
                        </div>
                        <ComboBox
                          label="Year"
                          name="qb-year"
                          id="qb-year"
                          options={playerYears}
                          value={newQBYear}
                          onChange={(value) => setNewQBYear(value)}
                          required={false}
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingQB(false)}
                            className="text-xs px-2 py-1 border rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddNewQB}
                            className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-md"
                            disabled={!newQBName || !newQBNumber}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                    {newQBs.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {newQBs.map((qb, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <p className="text-sm font-medium">
                                {qb.name} <span className="text-gray-500">#{qb.number}</span>
                              </p>
                              <span className="text-xs text-gray-500">{qb.year}</span>
                            </div>
                            <button type="button" onClick={() => removeNewQB(index)} className="text-xs text-red-500">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isAddingQB && newQBs.length === 0 && <p className="text-xs text-gray-500">No new QBs added</p>}
                  </div>
                </>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-xs cursor-default">Running Backs</h3>
              {isLoading ? (
                <div className="p-4 border rounded-md bg-gray-50">
                  <p className="text-sm text-gray-500">Loading previous players...</p>
                </div>
              ) : (
                <>
                  {previousPlayers.rbs.length > 0 && (
                    <Accordian
                      title={`Previous Season RBs`}
                      titleClassName="text-sm font-medium"
                      contentClassName="p-3"
                    >
                      <div className="space-y-2 mt-2">
                        {previousPlayers.rbs.map((rb) => (
                          <div
                            key={rb.id}
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              <CheckboxInput
                                id={`rb-${rb.id}`}
                                name={`rb-${rb.id}`}
                                label=""
                                defaultChecked={selectedRBs.has(rb.id)}
                                onChange={() => toggleRB(rb.id)}
                              />
                              <div>
                                <p className="text-sm font-medium">
                                  {rb.name} <span className="text-gray-500">#{rb.number}</span>
                                </p>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">{rb.year}</span>
                                  <span className="text-xs text-gray-500">→</span>
                                  <span className="text-xs text-neutral-900 font-semibold">{getNextYear(rb.year)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Accordian>
                  )}
                  <div className="border rounded-md p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">New RBs</h4>
                      {!isAddingRB && (
                        <button
                          type="button"
                          onClick={() => setIsAddingRB(true)}
                          className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-md"
                        >
                          Add RB
                        </button>
                      )}
                    </div>
                    {isAddingRB && (
                      <div className="space-y-3 rounded-md">
                        <div className="grid grid-cols-2 gap-3">
                          <TextInput
                            label="Name"
                            defaultValue={newRBName}
                            name=""
                            onChange={(e) => setNewRBName(e.target.value)}
                            placeholder="RB Name"
                          />
                          <TextInput
                            label="Number"
                            defaultValue={newRBNumber}
                            name=""
                            onChange={(e) => setNewRBNumber(e.target.value)}
                            type="number"
                            placeholder="#"
                          />
                        </div>
                        <ComboBox
                          label="Year"
                          name="rb-year"
                          id="rb-year"
                          options={playerYears}
                          value={newRBYear}
                          onChange={(value) => setNewRBYear(value)}
                          required={false}
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingRB(false)}
                            className="text-xs px-2 py-1 border rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddNewRB}
                            className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-md"
                            disabled={!newRBName || !newRBNumber}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                    {newRBs.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {newRBs.map((rb, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <p className="text-sm font-medium">
                                {rb.name} <span className="text-gray-500">#{rb.number}</span>
                              </p>
                              <span className="text-xs text-gray-500">{rb.year}</span>
                            </div>
                            <button type="button" onClick={() => removeNewRB(index)} className="text-xs text-red-500">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isAddingRB && newRBs.length === 0 && <p className="text-xs text-gray-500">No new RBs added</p>}
                  </div>
                </>
              )}
            </div>
          </div>
          <DefaultButton
            type="submit"
            text={isPending ? "Creating..." : "Create Season"}
            className="w-full h-9"
            disabled={isPending || isLoading}
          />
          {formError && <p className="text-sm text-red-600 mt-1">Please fill out all required fields.</p>}
        </form>
      </Accordian>
    </div>
  )
}

export function SeasonsTable({ seasons }: { seasons: Season[] }) {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const totalCount = seasons.length

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-grow overflow-y-auto">
        <div className="px-2 pb-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-neutral-700 uppercase tracking-wider py-2 border-b border-neutral-100">
            <div className="col-span-5">Type</div>
            <div className="col-span-3">Year</div>
          </div>
          {seasons.map((season) => (
            <div
              key={season.id}
              className="grid grid-cols-12 gap-2 items-center py-2 px-1 rounded-md hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
              onMouseEnter={() => setHoveredItem(season.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="col-span-5 font-normal text-neutral-800">{season.type}</div>
              <div className="col-span-3 text-neutral-700">{season.year}</div>
            </div>
          ))}
          {seasons.length === 0 && (
            <div className="py-4 text-sm text-neutral-500 text-center">
              No seasons found. Create a new one to get started.
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 py-1.5 border-t border-neutral-100 bg-white flex justify-end px-2 sticky bottom-0">
        <div className="text-xs font-medium text-neutral-600 rounded-full bg-neutral-100 px-2 py-0.5">
          {totalCount} total
        </div>
      </div>
    </div>
  )
}

function getNextYear(currentYear: string): string {
  const yearIndex = playerYears.indexOf(currentYear)

  if (yearIndex === -1 || yearIndex === playerYears.length - 1) {
    return currentYear
  }

  if (currentYear.includes("Redshirt")) {
    return playerYears[yearIndex + 2]
  } else if (currentYear.includes("Senior")) {
    return playerYears[yearIndex + 1]
  } else {
    return playerYears[yearIndex + 2]
  }
}


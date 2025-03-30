"use client"

import ComboBox from "@/components/Combobox"
import type { Season } from "@/types/seasonType"
import { useState } from "react"
import { updateUserCurrentSeason } from "./userSettingsActions"

interface SwitchSeasonsProps {
  seasons: Season[]
  currentSeasonId: number
}

export function SwitchSeasons({ seasons: initialSeasons, currentSeasonId }: SwitchSeasonsProps) {
  const [seasons] = useState(initialSeasons.sort((a, b) => b.year - a.year))

  const currentSeason = seasons.find((season) => season.id === currentSeasonId)
  const currentSeasonLabel = currentSeason ? `${currentSeason.type} ${currentSeason.year.toString().slice(-2)}` : ""

  const handleSeasonChange = async (seasonId: string) => {
    try {
      await updateUserCurrentSeason(Number(seasonId))
      window.location.reload()
    } catch (error) {
      console.error("Failed to update season:", error)
    }
  }

  return (
    <div className="space-y-2 mt-3">
      <ComboBox
        label="Current Season"
        id="season"
        name="season"
        options={seasons.map((season) => `${season.type} ${season.year.toString().slice(-2)}`)}
        value={currentSeasonLabel}
        onChange={(label) => {
          const season = seasons.find((s) => `${s.type} '${s.year.toString().slice(-2)}` === label)
          if (season) {
            handleSeasonChange(season.id.toString())
          }
        }}
      />
    </div>
  )
}


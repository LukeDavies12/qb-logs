"use client"

import type { GamePlay, PlayExecutionLevel } from "@/types/gameTypes"
import { Info } from "lucide-react"
import { useState } from "react"
import { evaluatePlay } from "./evaluatePlay"
import FullScreenModal from "./FullScreenModal"
import { PlayGroupingStats } from "./PlayGroupingAnalysis"

function calculateExecutionPercentage(executed: number, total: number): string {
  if (total === 0) return "0.0"
  const percentage = (executed / total) * 100
  return percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(1)
}

function isGoodOrBest(value: PlayExecutionLevel | null): boolean {
  return value === "Best" || value === "Good"
}

function isYes(value: boolean | null): boolean {
  return value === true
}

function isNo(value: boolean | null): boolean {
  return value === false
}

function isOnSchedulePlay(play: GamePlay): boolean {
  const down = play.down
  const yardsGained = play.yards_gained || 0
  const distance = play.distance || 0

  if (down === 1 || down === 2) {
    return yardsGained >= 4
  } else if (down === 3 || down === 4) {
    if (distance <= 12) {
      return yardsGained >= distance
    } else {
      return yardsGained >= 6
    }
  }
  return false
}

export default function QBAnalysis({ qb, plays }: { qb: { name: string; number: number }; plays: GamePlay[] }) {
  const [isAnalysisModelOpen, setIsAnalysisModelOpen] = useState(false)
  const involvedPlaysCount = plays.filter((play) => evaluatePlay(play)?.involved === true).length
  const involvedPlays = plays.filter((play) => evaluatePlay(play)?.involved === true && play.result != "Penalty")
  const executedPlays = plays.filter(
    (play) => evaluatePlay(play)?.executed === true && evaluatePlay(play)?.involved === true,
  )
  const executionPercentage = calculateExecutionPercentage(executedPlays.length, involvedPlays.length)
  const bigPlaysCount = plays.filter(
    (play) =>
      (play.result === "Complete" ||
        play.result === "Complete TD" ||
        play.result === "QB Rush" ||
        play.result === "QB Rush TD" ||
        play.result === "Scramble" ||
        play.result === "Scramble TD") &&
      play.yards_gained >= 10,
  ).length
  const greatPlaysCount = plays.filter(
    (play) =>
      play.pass_ball_placement === "Best" || play.qb_run_execution === "Best" || play.scramble_execution === "Best",
  ).length
  const passPlays = plays.filter(
    (play) =>
      (play.result === "Complete" ||
        play.result === "Incomplete" ||
        play.result === "Interception" ||
        play.result === "Complete TD") &&
      play.play_grouping_type?.type === "Pass",
  )
  const goodPassReads = plays.filter((play) => isGoodOrBest(play.pass_read) && play.result !== "Penalty")
  const goodBallPlacement = plays.filter((play) => isGoodOrBest(play.pass_ball_placement) && play.result !== "Penalty")
  const thrownPassOrOther = plays.filter(
    (play) =>
      play.result === "Complete" ||
      play.result === "Incomplete" ||
      play.result === "Interception" ||
      play.result === "Complete TD",
  )
  const goodScramblesAndRuns = plays.filter(
    (play) =>
      isGoodOrBest(play.qb_run_execution) || (isGoodOrBest(play.scramble_execution) && play.result !== "Penalty"),
  )
  const scrambeledOrRan = plays.filter(
    (play) =>
      play.result === "Scramble" ||
      play.result === "Scramble TD" ||
      play.result === "QB Rush" ||
      play.result === "QB Rush TD",
  )
  const yesRPOAndOptionReads = plays.filter(
    (play) => isYes(play.read_option_read_keys) || (isYes(play.rpo_read_keys) && play.result !== "Penalty"),
  )
  const rposAndReadOptions = plays.filter(
    (play) =>
      play.play_grouping_type?.type === "RPO" ||
      (play.play_grouping_type?.type === "Designed QB Run (With Read)" && play.result !== "Penalty"),
  )
  const pocketPresence = plays.filter((play) => isGoodOrBest(play.pocket_presence) && play.result !== "Penalty")
  const typeOfPass = plays.filter((play) => play.play_grouping_type?.type === "Pass" && play.result !== "Penalty")
  const sackedOnQB = plays.filter((play) => play.result === "Sack" && play.sack_on_qb === true)
  const sacked = plays.filter((play) => play.result === "Sack")
  const audibleOpportunityMissed = plays.filter((play) => play.audible_opportunity_missed === true)
  const audibleCalled = plays.filter((play) => play.audible_called === true)
  const audibleSuccess = plays.filter((play) => play.audible_success === true)

  const playsOnSchedule = plays.filter((play) => isOnSchedulePlay(play)).length
  const totalEligiblePlays = plays.filter((play) => {
    const isInvolvedAndNotPenalty = evaluatePlay(play)?.involved === true && play.result != "Penalty"
    if (play.down === 3 || play.down === 4) {
      return isInvolvedAndNotPenalty && play.distance <= 12
    }
    return isInvolvedAndNotPenalty
  }).length
  const onSchedulePercentage = calculateExecutionPercentage(playsOnSchedule, totalEligiblePlays)

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-neutral-900">{qb.name}</h2>
          <span className="text-neutral-500 text-xs">#{qb.number}</span>
        </div>
        <p className="text-neutral-500 text-xs font-semibold">
          {involvedPlaysCount} / {plays.length} plays involved
        </p>
      </div>
      <div className="relative mb-2">
        <div className="absolute left-0 top-0 w-2 h-full bg-neutral-700"></div>
        <div className="pl-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-neutral-50 rounded border border-neutral-100 p-2">
            <h3 className="text-xs text-neutral-700 font-semibold truncate">Grade Summary</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold">{executionPercentage}%</span>
              <span className="text-xs text-neutral-600">
                {executedPlays.length} / {involvedPlays.length}
              </span>
            </div>
          </div>
          <div className="bg-neutral-50 rounded border border-neutral-100 p-2">
            <h3 className="text-xs text-neutral-700 font-semibold truncate">10+ Yd plays created</h3>
            <div className="text-2xl font-bold mt-1">{bigPlaysCount}</div>
          </div>
          <div className="bg-neutral-50 rounded border border-neutral-100 p-2">
            <h3 className="text-xs text-neutral-700 font-semibold truncate">Great Throws/Runs</h3>
            <div className="text-2xl font-bold mt-1">{greatPlaysCount}</div>
          </div>
          <div className="bg-neutral-50 rounded border border-neutral-100 p-2">
            <div className="flex items-center gap-1 group relative">
              <h3 className="text-xs text-neutral-700 font-semibold truncate">On Schedule %</h3>
              <div className="relative">
                <Info size={14} className="text-neutral-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-neutral-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                  % of plays meeting yardage goals: 4+ yds on 1st/2nd down, conversions on 3rd/4th when &le;12 yds
                  needed, or 6+ yds when &gt;12 yds needed.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-800"></div>
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold">{onSchedulePercentage}%</span>
              <span className="text-xs text-neutral-600">
                {playsOnSchedule} / {totalEligiblePlays}
              </span>
            </div>
          </div>
        </div>
      </div>
      <h3 className="font-bold text-sm text-neutral-800 mb-1">Area Grades</h3>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-x-3 gap-y-2 mb-2">
        <div className="relative">
          <h4 className="text-xs font-medium text-neutral-600 truncate group">
            <span>Pass Reads</span>
            <div className="absolute bottom-full left-0 mb-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
              <div className="bg-white shadow-md border border-neutral-200 rounded px-2 py-1 text-xs whitespace-nowrap">
                Pass Reads
              </div>
            </div>
          </h4>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold">
              {calculateExecutionPercentage(goodPassReads.length, passPlays.length)}%
            </span>
            <span className="text-[10px] text-neutral-500">
              {goodPassReads.length} / {passPlays.length}
            </span>
          </div>
        </div>
        <div className="relative">
          <h4 className="text-xs font-medium text-neutral-600 truncate group">
            <span>Ball Placement</span>
            <div className="absolute bottom-full left-0 mb-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
              <div className="bg-white shadow-md border border-neutral-200 rounded px-2 py-1 text-xs whitespace-nowrap">
                Ball Placement
              </div>
            </div>
          </h4>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold">
              {calculateExecutionPercentage(goodBallPlacement.length, thrownPassOrOther.length)}%
            </span>
            <span className="text-[10px] text-neutral-500">
              {goodBallPlacement.length} / {thrownPassOrOther.length}
            </span>
          </div>
        </div>
        <div className="relative">
          <h4 className="text-xs font-medium text-neutral-600 truncate group">
            <span>Scrambles/Runs</span>
            <div className="absolute bottom-full left-0 mb-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
              <div className="bg-white shadow-md border border-neutral-200 rounded px-2 py-1 text-xs whitespace-nowrap">
                Scrambles/Runs
              </div>
            </div>
          </h4>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold">
              {calculateExecutionPercentage(goodScramblesAndRuns.length, scrambeledOrRan.length)}%
            </span>
            <span className="text-[10px] text-neutral-500">
              {goodScramblesAndRuns.length} / {scrambeledOrRan.length}
            </span>
          </div>
        </div>
        <div className="relative">
          <h4 className="text-xs font-medium text-neutral-600 truncate group">
            <span>RPO/Option Reads</span>
            <div className="absolute bottom-full left-0 mb-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
              <div className="bg-white shadow-md border border-neutral-200 rounded px-2 py-1 text-xs whitespace-nowrap">
                RPO/Option Reads
              </div>
            </div>
          </h4>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold">
              {calculateExecutionPercentage(yesRPOAndOptionReads.length, rposAndReadOptions.length)}%
            </span>
            <span className="text-[10px] text-neutral-500">
              {yesRPOAndOptionReads.length} / {rposAndReadOptions.length}
            </span>
          </div>
        </div>
        <div className="relative">
          <h4 className="text-xs font-medium text-neutral-600 truncate group">
            <span>Pocket Presence</span>
            <div className="absolute bottom-full left-0 mb-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
              <div className="bg-white shadow-md border border-neutral-200 rounded px-2 py-1 text-xs whitespace-nowrap">
                Pocket Presence
              </div>
            </div>
          </h4>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold">
              {calculateExecutionPercentage(pocketPresence.length, typeOfPass.length)}%
            </span>
            <span className="text-[10px] text-neutral-500">
              {pocketPresence.length} / {typeOfPass.length}
            </span>
          </div>
        </div>
        <div className="relative">
          <h4 className="text-xs font-medium text-neutral-600 truncate group">
            <span>Sack on QB</span>
            <div className="absolute bottom-full left-0 mb-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
              <div className="bg-white shadow-md border border-neutral-200 rounded px-2 py-1 text-xs whitespace-nowrap">
                Sack on QB
              </div>
            </div>
          </h4>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold">
              {calculateExecutionPercentage(sackedOnQB.length, sacked.length)}%
            </span>
            <span className="text-[10px] text-neutral-500">
              {sackedOnQB.length} / {sacked.length}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
        <div className="flex gap-4">
          <div className="relative">
            <h4 className="text-xs font-medium text-neutral-600 truncate group">
              <span>Missed Audibles</span>
              <div className="absolute bottom-full left-0 mb-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
                <div className="bg-white shadow-md border border-neutral-200 rounded px-2 py-1 text-xs whitespace-nowrap">
                  Missed Audibles
                </div>
              </div>
            </h4>
            <span className="text-base font-bold">{audibleOpportunityMissed.length}</span>
          </div>
          <div className="relative">
            <h4 className="text-xs font-medium text-neutral-600 truncate group">
              <span>Audible Hit Rate</span>
              <div className="absolute bottom-full left-0 mb-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
                <div className="bg-white shadow-md border border-neutral-200 rounded px-2 py-1 text-xs whitespace-nowrap">
                  Audible Hit Rate
                </div>
              </div>
            </h4>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold">
                {calculateExecutionPercentage(audibleSuccess.length, audibleCalled.length)}%
              </span>
              <span className="text-[10px] text-neutral-500">
                {audibleSuccess.length} / {audibleCalled.length}
              </span>
            </div>
          </div>
        </div>
        <button
          className="text-sm text-neutral-900 font-medium hover:text-neutral-400 underline"
          onClick={() => setIsAnalysisModelOpen(true)}
        >
          Play Grouping Analysis
        </button>
      </div>
      {isAnalysisModelOpen && (
        <FullScreenModal
          title="Play Grouping Analysis"
          isOpen={isAnalysisModelOpen}
          onClose={() => setIsAnalysisModelOpen(false)}
        >
          <PlayGroupingStats plays={plays} />
        </FullScreenModal>
      )}
    </div>
  )
}


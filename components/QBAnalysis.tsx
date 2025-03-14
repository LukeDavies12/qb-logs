"use client"

import type { GamePlay, PlayExecutionLevel } from "@/types/gameTypes"
import H2 from "./H2"
import { evaluatePlay } from "./evaluatePlay"

type QB = {
  name: string
  number: number
}

function calculateExecutionPercentage(executed: number, total: number): string {
  if (total === 0) return "0.0"
  return ((executed / total) * 100).toFixed(1)
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

type StatCardProps = {
  title: string
  value: string | number
  subtitle?: string
  className?: string
  isSummary?: boolean
}

function StatCard({ title, value, subtitle, className = "", isSummary = false }: StatCardProps) {
  return (
    <div
      className={`py-2 flex flex-col h-full ${isSummary ? "bg-neutral-50 rounded-lg p-4 border border-neutral-100" : ""} ${className}`}
    >
      <h3
        className={`font-semibold ${isSummary ? "text-sm sm:text-base text-neutral-700" : "text-xs sm:text-sm"} min-h-[2.5rem] flex items-center line-clamp-2`}
      >
        {title}
      </h3>
      <div className={`${isSummary ? "text-3xl my-2" : "text-xl"} font-bold  mt-auto`}>{value}</div>
      {subtitle && <span className={`text-xs ${isSummary ? "text-neutral-900" : "text-neutral-600"}`}>{subtitle}</span>}
    </div>
  )
}

function QBHeader({ qb, plays }: { qb: QB; plays: GamePlay[] }) {
  const involvedPlaysCount = plays.filter((play) => evaluatePlay(play)?.involved === true).length

  return (
    <div className="flex justify-between items-baseline">
      <div className="flex gap-2 items-baseline">
        <H2 text={qb.name} />
        <span className="text-neutral-500 text-xs">#{qb.number}</span>
      </div>
      <p className="text-neutral-500 text-xs">{involvedPlaysCount} plays involved</p>
    </div>
  )
}

// SummaryStats component for the main statistics
function SummaryStats({ plays }: { plays: GamePlay[] }) {
  const involvedPlays = plays.filter((play) => evaluatePlay(play)?.involved === true)
  const executedPlays = plays.filter((play) => evaluatePlay(play)?.executed === true && evaluatePlay(play)?.involved === true)
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

  return (
    <div className="my-4 relative">
      <div className="absolute left-0 top-0 w-1 h-full bg-neutral-300"></div>
      <div className="pl-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Grade Summary"
          value={`${executionPercentage}%`}
          subtitle={`${executedPlays.length} / ${involvedPlays.length}`}
          isSummary={true}
        />
        <StatCard title="10+ Yd plays created" value={bigPlaysCount} isSummary={true} />
        <StatCard title="Great Throws/ Runs/Scrambles" value={greatPlaysCount} isSummary={true} />
      </div>
    </div>
  )
}

function DetailedStats({ plays }: { plays: GamePlay[] }) {
  const passPlays = plays.filter((play) =>
    (play.result === "Complete" || play.result === "Incomplete" || play.result === "Interception" || play.result === "Complete TD") &&
    play.play_grouping_type?.type === "Pass") 
  const goodPassReads = plays.filter((play) => isGoodOrBest(play.pass_read) && play.result !== "Penalty")
  const goodBallPlacement = plays.filter((play) => isGoodOrBest(play.pass_ball_placement) && play.result !== "Penalty")
  const thrownPassOrOther = plays.filter((play) => (play.result === "Complete" || play.result === "Incomplete" || play.result === "Interception" || play.result === "Complete TD"))
  const goodScramblesAndRuns = plays.filter((play) => isGoodOrBest(play.qb_run_execution) || isGoodOrBest(play.scramble_execution) && play.result !== "Penalty")
  const scrambeledOrRan = plays.filter((play) => play.result === "Scramble" || play.result === "Scramble TD" || play.result === "QB Rush" || play.result === "QB Rush TD")
  const yesRPOAndOptionReads = plays.filter((play) => isYes(play.read_option_read_keys) || isYes(play.rpo_read_keys) && play.result !== "Penalty")
  const rposAndReadOptions = plays.filter((play) => play.play_grouping_type?.type === "RPO" || play.play_grouping_type?.type === "Designed QB Run (With Read)" && play.result !== "Penalty")
  const pocketPresence = plays.filter((play) => isGoodOrBest(play.pocket_presence) && play.result !== "Penalty")
  const typeOfPass = plays.filter((play) => play.play_grouping_type?.type === "Pass" && play.result !== "Penalty")
  const sackedOnQB = plays.filter((play) => play.result === "Sack" && play.sack_on_qb === true)
  const sacked = plays.filter((play) => play.result === "Sack")

  return (
    <div>
      <h3 className="font-bold text-neutral-800">Area Grades</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard title="Pass Reads" value={`${calculateExecutionPercentage(goodPassReads.length, passPlays.length)}%`} subtitle={`${goodPassReads.length} / ${passPlays.length}`} />
      <StatCard title="Ball Placement" value={`${calculateExecutionPercentage(goodBallPlacement.length, thrownPassOrOther.length)}%`} subtitle={`${goodBallPlacement.length} / ${thrownPassOrOther.length}`} />
      <StatCard title="Scrambles/ Runs" value={`${calculateExecutionPercentage(goodScramblesAndRuns.length, scrambeledOrRan.length)}%`} subtitle={`${goodScramblesAndRuns.length} / ${scrambeledOrRan.length}`} />
      <StatCard title="RPO/Option Reads" value={`${calculateExecutionPercentage(yesRPOAndOptionReads.length, rposAndReadOptions.length)}%`} subtitle={`${yesRPOAndOptionReads.length} / ${rposAndReadOptions.length}`} />
      <StatCard title="Pocket Presence" value={`${calculateExecutionPercentage(pocketPresence.length, typeOfPass.length)}%`} subtitle={`${pocketPresence.length} / ${typeOfPass.length}`} />
      <StatCard title="Sack on QB" value={`${calculateExecutionPercentage(sackedOnQB.length, sacked.length)}%`} subtitle={`${sackedOnQB.length} / ${sacked.length}`} />
    </div>
    </div>
  )
}

export default function QBAnalysis({ qb, plays }: { qb: QB; plays: GamePlay[] }) {
  return (
    <div className="rounded-lg border px-4 py-1 flex flex-col bg-white">
      <QBHeader qb={qb} plays={plays} />
      <SummaryStats plays={plays} />
      <div className="border-b border-neutral-200 my-3"></div>
      <DetailedStats plays={plays} />
    </div>
  )
}


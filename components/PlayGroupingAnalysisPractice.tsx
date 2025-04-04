"use client"

import type React from "react"

import { ChevronDown, ChevronUp } from "lucide-react"
import { useMemo, useState } from "react"
import { evaluatePlay } from "./evaluatePlay"
import { PracticePlay } from "@/types/practiceTypes"
import { evaluatePlayPractice } from "./evaluatePlayPractice"

export const PlayGroupingStatsPractice: React.FC<{ plays: PracticePlay[] }> = ({ plays }) => {
  const [sortField, setSortField] = useState<string>("count")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const playGroupingStats = useMemo(() => {
    const groupedPlays: Record<string, PracticePlay[]> = {}

    plays.forEach((play) => {
      if (play.play_grouping_type?.name) {
        const groupName = play.play_grouping_type.name
        if (!groupedPlays[groupName]) {
          groupedPlays[groupName] = []
        }
        groupedPlays[groupName].push(play)
      }
    })

    return Object.entries(groupedPlays).map(([groupName, groupPlays]) => {
      const count = groupPlays.length

      const qbStats = groupPlays.reduce(
        (acc, play) => {
          const evaluation = evaluatePlayPractice(play)
          if (evaluation?.involved === true) {
            acc.involvedCount += 1
            if (evaluation.executed) {
              acc.executedCount += 1
            }
          }
          return acc
        },
        { involvedCount: 0, executedCount: 0 },
      )

      const successPercentage =
        qbStats.involvedCount > 0 ? Math.round((qbStats.executedCount / qbStats.involvedCount) * 100) : 0

      const yardsGained = groupPlays.map((play) => play.yards_gained)
      const totalYards = yardsGained.reduce((sum, yards) => sum + yards, 0)
      const avgYards = count > 0 ? Math.round((totalYards / count) * 10) / 10 : 0
      const bestYards = Math.max(...yardsGained)
      const worstYards = Math.min(...yardsGained)

      return {
        groupName,
        count,
        involvedCount: qbStats.involvedCount,
        executedCount: qbStats.executedCount,
        successPercentage,
        avgYards,
        bestYards,
        worstYards,
      }
    })
  }, [plays])

  const sortedStats = useMemo(() => {
    return [...playGroupingStats].sort((a, b) => {
      let compareA, compareB

      switch (sortField) {
        case "groupName":
          compareA = a.groupName
          compareB = b.groupName
          break
        case "count":
          compareA = a.count
          compareB = b.count
          break
        case "grade":
          compareA = a.successPercentage
          compareB = b.successPercentage
          break
        case "avgYards":
          compareA = a.avgYards
          compareB = b.avgYards
          break
        case "bestYards":
          compareA = a.bestYards
          compareB = b.bestYards
          break
        case "worstYards":
          compareA = a.worstYards
          compareB = b.worstYards
          break
        default:
          compareA = a.count
          compareB = b.count
      }

      if (sortDirection === "asc") {
        return compareA > compareB ? 1 : -1
      } else {
        return compareA < compareB ? 1 : -1
      }
    })
  }, [playGroupingStats, sortField, sortDirection])

  const renderSortIndicator = (field: string) => {
    if (sortField === field) {
      return sortDirection === "asc" ? (
        <ChevronUp className="w-3.5 h-3.5 inline-block ml-1 text-neutral-500" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 inline-block ml-1 text-neutral-500" />
      )
    }
    return null
  }

  return (
    <div className="mt-2 px-2 rounded-md">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-100">
              <th
                className="text-left px-3 py-1 text-xs font-medium text-neutral-600 cursor-pointer hover:text-neutral-900 transition-colors border-r border-neutral-100 uppercase"
                onClick={() => handleSort("groupName")}
              >
                <div className="flex items-center">Play Grouping {renderSortIndicator("groupName")}</div>
              </th>
              <th
                className="text-right px-3 py-1 text-xs font-medium text-neutral-600 cursor-pointer hover:text-neutral-900 transition-colors border-r border-neutral-100 uppercase"
                onClick={() => handleSort("count")}
              >
                <div className="flex items-center justify-end">Play Count {renderSortIndicator("count")}</div>
              </th>
              <th
                className="text-right px-3 py-1 text-xs font-medium text-neutral-600 cursor-pointer hover:text-neutral-900 transition-colors border-r border-neutral-100 uppercase"
                onClick={() => handleSort("grade")}
              >
                <div className="flex items-center justify-end">Graded Out {renderSortIndicator("grade")}</div>
              </th>
              <th
                className="text-right px-3 py-1 text-xs font-medium text-neutral-600 cursor-pointer hover:text-neutral-900 transition-colors border-r border-neutral-100 uppercase"
                onClick={() => handleSort("avgYards")}
              >
                <div className="flex items-center justify-end">Avg Yds {renderSortIndicator("avgYards")}</div>
              </th>
              <th
                className="text-right px-3 py-1 text-xs font-medium text-neutral-600 cursor-pointer hover:text-neutral-900 transition-colors border-r border-neutral-100 uppercase"
                onClick={() => handleSort("bestYards")}
              >
                <div className="flex items-center justify-end">Best {renderSortIndicator("bestYards")}</div>
              </th>
              <th
                className="text-right px-3 py-1 text-xs font-medium text-neutral-600 cursor-pointer hover:text-neutral-900 transition-colors uppercase"
                onClick={() => handleSort("worstYards")}
              >
                <div className="flex items-center justify-end">Worst {renderSortIndicator("worstYards")}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map((stat, index) => (
              <tr
                key={stat.groupName}
                className={`border-b border-neutral-100 hover:bg-neutral-50/80 transition-colors`}
              >
                <td className="px-3 py-1 text-sm font-medium text-neutral-800 border-r border-neutral-100">
                  {stat.groupName}
                </td>
                <td className="px-3 py-1 text-sm text-right border-r border-neutral-100">
                  <span className="text-neutral-800 font-medium">{stat.count}</span>
                </td>
                <td className="px-3 py-1 text-right border-r border-neutral-100">
                  <span
                    className={`pl-1.5 py-0.5 rounded-sm ${stat.involvedCount === 0
                        ? "text-neutral-800 bg-neutral-50"
                        : stat.successPercentage >= 70
                          ? "text-green-900 bg-green-50"
                          : stat.successPercentage >= 50
                            ? "text-amber-900 bg-amber-50"
                            : stat.successPercentage > 0
                              ? "text-red-900 bg-red-50"
                              : "text-neutral-800 bg-neutral-50"
                      }`}
                  >
                    {stat.involvedCount === 0
                      ? "-"
                      : (
                        <span>
                          {stat.successPercentage}% &nbsp;
                          <span className="text-neutral-700 p-0.5 text-xs bg-neutral-100">
                            {stat.executedCount} / {stat.involvedCount}
                          </span>
                        </span>
                      )}
                  </span>
                </td>
                <td className="px-3 py-1 text-sm text-right border-r border-neutral-100">
                  <span
                    className={`px-1.5 py-0.5 rounded-sm ${stat.avgYards <= 0
                        ? "text-red-900 bg-red-50"
                        : stat.avgYards <= 3
                          ? "text-neutral-900 bg-neutral-50"
                          : stat.avgYards <= 6
                            ? "text-green-900 bg-green-50"
                            : stat.avgYards <= 10
                              ? "text-indigo-900 bg-indigo-50"
                              : "text-blue-900 bg-blue-50"
                      }`}
                  >
                    {stat.avgYards.toFixed(1)}
                  </span>
                </td>
                <td className="px-3 py-1 text-sm text-right border-r border-neutral-100">
                  <span
                    className={`px-1.5 py-0.5 rounded-sm ${stat.bestYards <= 0
                        ? "text-red-900 bg-red-50"
                        : stat.bestYards <= 3
                          ? "text-neutral-900 bg-neutral-50"
                          : stat.bestYards <= 10
                            ? "text-green-900 bg-green-50"
                            : stat.bestYards <= 25
                              ? "text-indigo-900 bg-indigo-50"
                              : "text-blue-900 bg-blue-50"
                      }`}
                  >
                    {stat.bestYards}
                  </span>
                </td>
                <td className="px-3 py-1 text-sm text-right">
                  <span
                    className={`px-1.5 py-0.5 rounded-sm ${stat.worstYards < 0
                        ? "text-red-900 bg-red-50"
                        : stat.worstYards <= 1
                          ? "text-neutral-900 bg-neutral-50"
                          : "text-green-800"
                      }`}
                  >
                    {stat.worstYards}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex-shrink-0 py-2 flex justify-end px-2 mt-1 mb-1">
        <div className="text-neutral-800 rounded-md px-3 py-1.5 flex gap-2 bg-neutral-50/50">
          <div>
            <span className="font-medium text-neutral-700">{playGroupingStats.length}</span> play groupings
          </div>
          /
          <div>
            <span className="font-medium text-neutral-700">{plays.length}</span> total plays
          </div>
        </div>
      </div>
    </div>
  )
}


import { GamePlay } from "@/types/gameTypes";
import { useMemo, useState } from "react";
import { evaluatePlay } from "./evaluatePlay";
import { ChevronDown, ChevronUp } from "lucide-react";

export const PlayGroupingStats: React.FC<{ plays: GamePlay[] }> = ({ plays }) => {
  const [sortField, setSortField] = useState<string>("count");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const playGroupingStats = useMemo(() => {
    const groupedPlays: Record<string, GamePlay[]> = {};

    plays.forEach(play => {
      if (play.play_grouping_type?.name) {
        const groupName = play.play_grouping_type.name;
        if (!groupedPlays[groupName]) {
          groupedPlays[groupName] = [];
        }
        groupedPlays[groupName].push(play);
      }
    });

    return Object.entries(groupedPlays).map(([groupName, groupPlays]) => {
      const count = groupPlays.length;

      const qbStats = groupPlays.reduce(
        (acc, play) => {
          const evaluation = evaluatePlay(play);
          if (evaluation?.involved === true) {
            acc.involvedCount += 1;
            if (evaluation.executed) {
              acc.executedCount += 1;
            }
          }
          return acc;
        },
        { involvedCount: 0, executedCount: 0 }
      );

      const successPercentage = qbStats.involvedCount > 0
        ? Math.round((qbStats.executedCount / qbStats.involvedCount) * 100)
        : 0;

      const yardsGained = groupPlays.map(play => play.yards_gained);
      const totalYards = yardsGained.reduce((sum, yards) => sum + yards, 0);
      const avgYards = count > 0 ? Math.round((totalYards / count) * 10) / 10 : 0;
      const bestYards = Math.max(...yardsGained);
      const worstYards = Math.min(...yardsGained);

      return {
        groupName,
        count,
        involvedCount: qbStats.involvedCount,
        executedCount: qbStats.executedCount,
        successPercentage,
        avgYards,
        bestYards,
        worstYards
      };
    });
  }, [plays]);

  const sortedStats = useMemo(() => {
    return [...playGroupingStats].sort((a, b) => {
      let compareA, compareB;

      switch (sortField) {
        case "groupName":
          compareA = a.groupName;
          compareB = b.groupName;
          break;
        case "count":
          compareA = a.count;
          compareB = b.count;
          break;
        case "grade":
          compareA = a.successPercentage;
          compareB = b.successPercentage;
          break;
        case "avgYards":
          compareA = a.avgYards;
          compareB = b.avgYards;
          break;
        case "bestYards":
          compareA = a.bestYards;
          compareB = b.bestYards;
          break;
        case "worstYards":
          compareA = a.worstYards;
          compareB = b.worstYards;
          break;
        default:
          compareA = a.count;
          compareB = b.count;
      }

      if (sortDirection === "asc") {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });
  }, [playGroupingStats, sortField, sortDirection]);

  const renderSortIndicator = (field: string) => {
    if (sortField === field) {
      return sortDirection === "asc" ?
        <ChevronUp className="w-4 h-4 inline-block ml-1" /> :
        <ChevronDown className="w-4 h-4 inline-block ml-1" />;
    }
    return null;
  };

  return (
    <div className="mt-2 px-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th
                className="text-left px-2 py-2 text-sm font-medium text-neutral-600 cursor-pointer hover:text-neutral-800 border-r border-neutral-100"
                onClick={() => handleSort("groupName")}
              >
                Play Grouping {renderSortIndicator("groupName")}
              </th>
              <th
                className="text-right px-2 py-2 text-sm font-medium text-neutral-600 cursor-pointer hover:text-neutral-800 border-r border-neutral-100"
                onClick={() => handleSort("count")}
              >
                Play Count {renderSortIndicator("count")}
              </th>
              <th
                className="text-right px-2 py-2 text-sm font-medium text-neutral-600 cursor-pointer hover:text-neutral-800 border-r border-neutral-100"
                onClick={() => handleSort("grade")}
              >
                Graded Out {renderSortIndicator("grade")}
              </th>
              <th
                className="text-right px-2 py-2 text-sm font-medium text-neutral-600 cursor-pointer hover:text-neutral-800 border-r border-neutral-100"
                onClick={() => handleSort("avgYards")}
              >
                Avg Yds {renderSortIndicator("avgYards")}
              </th>
              <th
                className="text-right px-2 py-2 text-sm font-medium text-neutral-600 cursor-pointer hover:text-neutral-800 border-r border-neutral-100"
                onClick={() => handleSort("bestYards")}
              >
                Best {renderSortIndicator("bestYards")}
              </th>
              <th
                className="text-right px-2 py-2 text-sm font-medium text-neutral-600 cursor-pointer hover:text-neutral-800"
                onClick={() => handleSort("worstYards")}
              >
                Worst {renderSortIndicator("worstYards")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map((stat) => (
              <tr key={stat.groupName} className="border-b border-neutral-100 hover:bg-neutral-50/80 transition-colors">
                <td className="px-2 py-2 text-sm font-medium text-neutral-800 border-r border-neutral-100">{stat.groupName}</td>
                <td className="px-2 py-2 text-sm text-right border-r border-neutral-100">
                  <span className="text-neutral-800">{stat.count}</span>
                </td>
                <td className="px-2 py-2 text-right border-r border-neutral-100">
                    <span
                    className={`pl-1 ${stat.involvedCount === 0
                      ? "text-neutral-600"
                      : stat.successPercentage >= 70
                      ? "text-green-800"
                      : stat.successPercentage >= 50
                        ? "text-amber-800"
                        : stat.successPercentage > 0
                        ? "text-red-800"
                        : "text-neutral-600"
                      }`}
                    >
                    {stat.involvedCount === 0
                      ? "-"
                      : `${stat.successPercentage}% (${stat.executedCount}/${stat.involvedCount})`}
                    </span>
                </td>
                <td className="px-2 py-2 text-sm text-right border-r border-neutral-100">
                  <span
                    className={`pl-1 ${stat.avgYards <= 0
                      ? "text-red-800"
                      : stat.avgYards <= 3
                        ? "text-neutral-800"
                        : stat.avgYards <= 6
                          ? "text-green-800"
                          : stat.avgYards <= 10
                            ? "text-indigo-800"
                            : "text-blue-800"
                      }`}
                  >
                    {stat.avgYards.toFixed(1)}
                  </span>
                </td>
                <td className="px-2 py-2 text-sm text-right border-r border-neutral-100">
                  <span
                    className={`pl-1 ${stat.bestYards <= 0
                      ? "text-red-800"
                      : stat.bestYards <= 3
                        ? "text-neutral-800"
                        : stat.bestYards <= 10
                          ? "text-green-800"
                          : stat.bestYards <= 25
                            ? "text-indigo-800"
                            : "text-blue-800"
                      }`}
                  >
                    {stat.bestYards}
                  </span>
                </td>
                <td className="px-2 py-2 text-sm text-right">
                  <span
                    className={`pl-1 ${stat.worstYards < 0
                      ? "text-red-800"
                      : stat.worstYards <= 1
                        ? "text-neutral-800"
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

      <div className="flex-shrink-0 py-1.5 bg-white flex justify-end px-2 mt-2">
        <div className="text-neutral-800 rounded-sm px-2.5 py-2 border border-neutral-200/70 flex gap-2">
          <div>
            <span className="font-bold text-neutral-700">{playGroupingStats.length}</span> play groupings
          </div>/
          <div>
            <span className="font-bold text-neutral-700">{plays.length}</span> total plays
          </div>
        </div>
      </div>
    </div>
  );
};
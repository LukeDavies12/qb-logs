"use client"

import H2 from "@/components/H2"
import type { PlayGrouping } from "@/types/gameTypes"
import type { Season, SeasonQB, SeasonRB } from "@/types/seasonType"
import type { Invite, User } from "@/types/userTypes"
import { useState } from "react"
import AddPlayGrouping from "./PlayGroupings/AddPlayGrouping"
import PlayGroupingsTable from "./PlayGroupings/PlayGroupingsTable"
import AddSeasonQB from "./SeasonQBs/AddSeasonQB"
import SeasonQBsTable from "./SeasonQBs/SeasonQBsTable"
import AddSeasonRB from "./SeasonRBs/AddSeasonRB"
import SeasonRBsTable from "./SeasonRBs/SeasonRBsTable"
import { AddSeason, SeasonsTable } from "./Seasons/SeasonComponents"
import AddTeamInvite from "./Users/AddTeamInvite"
import UsersAndInvitesTable from "./Users/UsersTable"

interface TeamTabsProps {
  data: {
    currentUser: User
    seasonQBs: SeasonQB[]
    seasonRBs: SeasonRB[]
    playGroupings: PlayGrouping[]
    teamUsers: User[]
    teamInvites: Invite[]
    seasons: Season[]
  }
  qbsHasStarter: boolean
  rbsHasStarter: boolean
}

export default function TeamTabs({ data, qbsHasStarter, rbsHasStarter }: TeamTabsProps) {
  const [activeTab, setActiveTab] = useState("playGroupings")

  const tabs = [
    { id: "playGroupings", label: "Play Groupings" },
    { id: "users", label: "Users & Invites" },
    { id: "qbs", label: "Current Season QBs" },
    { id: "rbs", label: "Current Season RBs" },
    { id: "seasons", label: "Seasons" },
  ]

  return (
    <div className="space-y-4">
      <div className="border-b">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id ? "border-b-2 border-gray-700 text-gray-800" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-4xl mx-auto">
        {activeTab === "playGroupings" && (
          <div className="h-[610px] rounded-lg border pt-2 px-3 flex flex-col">
            <H2 text="Play Groupings" />
            <div className="mb-2">
              <AddPlayGrouping />
            </div>
            <PlayGroupingsTable playGroupings={data.playGroupings} />
          </div>
        )}
        {activeTab === "users" && (
          <div className="h-[610px] rounded-lg border pt-2 px-3 flex flex-col">
            <H2 text="Users and Invites" />
            <div className="mb-2">
              <AddTeamInvite />
            </div>
            <UsersAndInvitesTable
              users={data.teamUsers}
              invites={data.teamInvites}
              currentUserId={data.currentUser.id as number}
            />
          </div>
        )}
        {activeTab === "qbs" && (
          <div className="h-[610px] rounded-lg border px-3 pt-2 flex flex-col">
            <H2 text="Current Season QBs" />
            <div className="mb-2">
              <AddSeasonQB hasStarter={qbsHasStarter} />
            </div>
            <SeasonQBsTable seasonQBs={data.seasonQBs} />
          </div>
        )}
        {activeTab === "rbs" && (
          <div className="h-[610px] rounded-lg border px-3 pt-2 flex flex-col">
            <H2 text="Current Season RBs" />
            <div className="mb-2">
              <AddSeasonRB hasStarter={rbsHasStarter} />
            </div>
            <SeasonRBsTable seasonRBs={data.seasonRBs} />
          </div>
        )}
        {activeTab === "seasons" && (
          <div className="h-[610px] rounded-lg border px-3 pt-2 flex flex-col">
            <H2 text="Seasons" />
            <div className="mb-2">
              <AddSeason />
            </div>
            <SeasonsTable seasons={data.seasons} />
          </div>
        )}
      </div>
    </div>
  )
}


"use client"

import { useState, useCallback, useEffect } from "react"
import { MoreHorizontal, ShieldAlert } from "lucide-react"
import Dropdown from "@/components/Dropdown"
import type { User, Invite } from "@/types/userTypes"
import { useActionState, useTransition } from "react"
import { deleteTeamUser, deleteTeamInvite } from "@/app/(app)/manage-team/manageTeamActions"

export default function UsersAndInvitesTable({ 
  users, 
  invites, 
  currentUserId 
}: { 
  users: User[], 
  invites: Invite[], 
  currentUserId: number 
}) {
  const [hoveredItem, setHoveredItem] = useState<{ type: 'user' | 'invite', id: number } | null>(null)
  const [deleteUserState, deleteUserAction, isDeleteUserPending] = useActionState(deleteTeamUser, { error: "", success: false })
  const [deleteInviteState, deleteInviteAction, isDeleteInvitePending] = useActionState(deleteTeamInvite, { error: "", success: false })
  const [isPendingTransition, startTransition] = useTransition()

  // Set current user ID on component mount
  // Combine users and invites for display
  const combinedItems = [
    ...users.map(user => ({ type: 'user' as const, data: user, isSelf: user.id === currentUserId })),
    ...invites.map(invite => ({ type: 'invite' as const, data: invite, isSelf: false }))
  ]

  // Sort combined items - users first, then invites, both sorted by display name
  const sortedItems = [...combinedItems].sort((a, b) => {
    // Users come before invites
    if (a.type !== b.type) {
      return a.type === 'user' ? -1 : 1
    }
    
    // Sort by display name within the same type
    const aName = a.type === 'user' ? 
      (a.data.display_name || a.data.email) : 
      (a.data.display_name || a.data.email)
      
    const bName = b.type === 'user' ? 
      (b.data.display_name || b.data.email) : 
      (b.data.display_name || b.data.email)
      
    return aName.localeCompare(bName)
  })

  // Calculate total counts
  const totalUsers = users.length
  const totalInvites = invites.length
  const totalCount = totalUsers + totalInvites

  const handleDeleteUser = (user: User) => {
    // Prevent deleting yourself
    if (user.id === currentUserId) {
      alert("You cannot remove yourself from the team.")
      return
    }
    
    if (window.confirm(`Are you sure you want to remove "${user.display_name || user.email}" from the team?`)) {
      const formData = new FormData()
      formData.append("id", user.id.toString())

      startTransition(() => {
        deleteUserAction(formData)
      })
    }
  }

  const handleDeleteInvite = (invite: Invite) => {
    if (window.confirm(`Are you sure you want to cancel the invitation for "${invite.email}"?`)) {
      const formData = new FormData()
      formData.append("id", invite.id.toString())

      startTransition(() => {
        deleteInviteAction(formData)
      })
    }
  }

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }

  const isExpired = (expiresAt: Date) => {
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Scrollable content area */}
      <div className="flex-grow overflow-y-auto">
        <div className="px-2 pb-2">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-neutral-700 uppercase tracking-wider py-2 border-b border-neutral-100">
            <div className="col-span-5">Display Name</div>
            <div className="col-span-3">Job Title</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table rows */}
          {sortedItems.map((item) => {
            const isUser = item.type === 'user'
            const isSelf = item.isSelf
            const displayName = isUser 
              ? (item.data.display_name || item.data.email) 
              : item.data.email
            const jobTitle = item.data.job_title
            const role = formatRole(item.data.role)
            const itemId = item.data.id

            return (
              <div
                key={`${item.type}-${itemId}`}
                className="grid grid-cols-12 gap-2 items-center py-2 px-1 rounded-md hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
                onMouseEnter={() => setHoveredItem({ type: item.type, id: itemId })}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="col-span-5 font-normal text-neutral-800 flex items-center gap-2">
                  <span className={!isUser ? "text-neutral-600" : ""}>
                    {displayName}
                  </span>
                  {isSelf && (
                    <span className="text-xs bg-neutral-800 text-white rounded-md px-1.5 py-0.5 ml-1 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      You
                    </span>
                  )}
                  {!isUser && (
                    <span className={`text-xs rounded-md px-1.5 py-0.5 ml-2 ${
                      item.data.status === 'Pending' 
                        ? isExpired(item.data.expires_at) 
                          ? "bg-neutral-200 text-neutral-600" 
                          : "bg-yellow-100 text-yellow-800"
                        : item.data.status === 'Accepted' 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                    }`}>
                      {item.data.status === 'Pending' && isExpired(item.data.expires_at) 
                        ? "Expired" 
                        : item.data.status}
                    </span>
                  )}
                </div>
                <div className="col-span-3 text-neutral-700">{jobTitle}</div>
                <div className="col-span-3 text-neutral-700">
                  <span className="text-xs rounded-full px-1.5 py-0.5 bg-neutral-100">
                    {role}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Dropdown
                    trigger={
                      <button
                        className={`p-1 rounded-full ${
                          hoveredItem?.type === item.type && hoveredItem?.id === itemId 
                            ? "text-neutral-600" 
                            : "text-neutral-300"
                        }`}
                        aria-label="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    }
                    items={
                      isUser ? [
                        {
                          label: isSelf ? "Cannot remove yourself" : "Remove from team",
                          onClick: () => handleDeleteUser(item.data as User),
                          className: isSelf 
                            ? "text-neutral-400 cursor-not-allowed" 
                            : "text-red-600 hover:bg-red-50",
                          disabled: isSelf
                        },
                      ] : [
                        {
                          label: "Cancel invitation",
                          onClick: () => handleDeleteInvite(item.data as Invite),
                          className: "text-red-600 hover:bg-red-50",
                        },
                        {
                          label: "Resend invitation",
                          onClick: () => console.log("Resend invitation", item.data),
                          className: item.data.status === 'Pending' && !isExpired(item.data.expires_at) 
                            ? "" 
                            : "text-blue-600 hover:bg-blue-50",
                          disabled: item.data.status === 'Pending' && !isExpired(item.data.expires_at)
                        },
                      ]
                    }
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error messages */}
      {(deleteUserState.error || deleteInviteState.error) && (
        <div className="px-2 py-2 bg-red-50 border-t border-red-100">
          <p className="text-sm text-red-600">{deleteUserState.error || deleteInviteState.error}</p>
        </div>
      )}

      {/* Footer that stays at the bottom */}
      <div className="flex-shrink-0 py-1.5 border-t border-neutral-100 bg-white flex justify-between px-2 sticky bottom-0">
        <div className="text-xs font-medium text-neutral-600 rounded-full bg-neutral-100 px-2 py-0.5">
          {totalUsers} users
        </div>
        <div className="text-xs font-medium text-neutral-600 rounded-full bg-neutral-100 px-2 py-0.5">
          {totalInvites} invites
        </div>
        <div className="text-xs font-medium text-neutral-600 rounded-full bg-neutral-100 px-2 py-0.5">
          {totalCount} total
        </div>
      </div>
    </div>
  )
}
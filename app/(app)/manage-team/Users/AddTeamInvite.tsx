"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { useTransition } from "react"
import { useActionState } from "react"
import { createTeamInvite } from "@/app/(app)/manage-team/manageTeamActions"
import { UserRole } from "@/types/userTypes"

export default function AddTeamInvite() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [role, setRole] = useState<UserRole>("Default") // Default role
  const [createState, createAction, isCreatePending] = useActionState(createTeamInvite, { error: "", success: false })
  const [isPendingTransition, startTransition] = useTransition()

  // Effect to handle successful invites
  useEffect(() => {
    if (createState.success) {
      setIsOpen(false)
      resetForm()
    }
  }, [createState.success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formData = new FormData()
    formData.append("email", email)
    formData.append("display_name", displayName)
    formData.append("job_title", jobTitle)
    formData.append("role", role)
    
    startTransition(() => {
      createAction(formData)
    })
  }

  const resetForm = () => {
    setEmail("")
    setDisplayName("")
    setJobTitle("")
    setRole("Read Only")
  }

  return (
    <div className="mb-3">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1 text-sm font-medium text-neutral-700 hover:text-neutral-900"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      ) : (
        <div className="border rounded-md p-3 bg-white">
          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-xs text-neutral-600 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="displayName" className="block text-xs text-neutral-600 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>
              
              <div>
                <label htmlFor="jobTitle" className="block text-xs text-neutral-600 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-xs text-neutral-600 mb-1">
                  Role *
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  required
                >
                  <option value="Admin">Admin</option>
                  <option value="Default">Default</option>
                  <option value="Read Only">Read Only</option>
                </select>
              </div>

              {createState.error && (
                <div className="text-sm text-red-600">{createState.error}</div>
              )}
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    resetForm()
                  }}
                  className="px-3 py-1 text-xs border rounded hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatePending || isPendingTransition}
                  className="px-3 py-1 text-xs bg-neutral-800 text-white rounded hover:bg-neutral-700 disabled:opacity-50"
                >
                  {isCreatePending || isPendingTransition ? "Inviting..." : "Send Invite"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
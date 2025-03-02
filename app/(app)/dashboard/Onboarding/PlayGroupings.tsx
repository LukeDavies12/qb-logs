"use client"

import type React from "react"
import { useActionState } from "react"
import { useState } from "react"
import DefaultButton from "@/components/DefaultButton"
import type { PlayGroupingType } from "@/types/playGroupingTypes"
import { XIcon } from "lucide-react"
import { createPlayGroupings } from "./onboardActions"
import ComboBox from "@/components/Combobox"
import TextInput from "@/components/TextInput"
import SecondaryButton from "@/components/SecondaryButton"

export default function PlayGroupingsOnboardingForm() {
  const [formError, setFormError] = useState(false)
  const [playGroupings, setPlayGroupings] = useState<TempPlayGrouping[]>([])
  const [currentType, setCurrentType] = useState<PlayGroupingType | "">("")
  const [state, formAction, isPending] = useActionState(createPlayGroupings, initialState)

  const handleAddGrouping = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const type = currentType as PlayGroupingType

    if (!name || !type) {
      setFormError(true)
      return
    }
    const isDuplicate = playGroupings.some(
      (group) => group.name.toLowerCase() === name.toLowerCase() && group.type === type,
    )
    if (isDuplicate) {
      setFormError(true)
      return
    }

    setPlayGroupings((prev) => [...prev, { name, type }])
    setFormError(false)
    e.currentTarget.reset()
    setCurrentType("")
  }

  const handleRemoveGrouping = (index: number) => {
    setPlayGroupings((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900">Step 1: Create Play Groupings</h2>
          <p className="mt-1 text-base text-neutral-500">Define the categories that matter most to your offensive scheme. <span className="font-semibold">These groupings allow you to measure performance against your expectations as a play caller.</span> We've found that 10-20 groupings is perfect for most teams to get started.</p>
        </div>
        <form onSubmit={handleAddGrouping} className="space-y-3 mb-4">
          <TextInput label="Name" name="name" type="text" placeholder="Enter play grouping name" required error={formError} />
          <ComboBox<PlayGroupingType> label="Type" name="type"options={playGroupingTypes} required error={formError} value={currentType} onChange={(value) => setCurrentType(value)} />
          <SecondaryButton type="submit" text="Add Grouping" className="w-full" />
        </form>
        {state.error && <p className="text-sm text-red-600 mb-4">{state.error}</p>}
        {playGroupings.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-neutral-900">Added Groupings</h3>
            <div className="space-y-2 h-[310px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent hover:scrollbar-thumb-neutral-300">
              {playGroupings.map((group, index) => (
                <div key={index} className="flex items-center justify-between px-3 py-1 bg-neutral-50 rounded-md border border-neutral-200" >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{group.name}</p>
                    <p className="text-xs text-neutral-500">{group.type}</p>
                  </div>
                  <button type="button" onClick={() => handleRemoveGrouping(index)} className="p-1 text-neutral-400 hover:text-neutral-600" aria-label="Remove grouping">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <form action={formAction}>
              <input type="hidden" name="groupings" value={JSON.stringify(playGroupings)} />
              <DefaultButton type="submit" text={isPending ? "Creating..." : "Create Your Groupings"} className="mt-4 w-full" disabled={isPending} />
            </form>
          </div>
        )}
      </div>
      <div>
        <div className="mb-8">
          <h2 className="text-lg font-medium text-neutral-900">Example Groupings</h2>
          <p className="mt-1 text-base text-neutral-500">Play grouping patterns to help you get started.</p>
        </div>
        <div className="grid gap-3">
          {examples.map((example, index) => (
            <ExampleCard key={index} title={example.title} type={example.type} description={example.description} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface TempPlayGrouping {
  name: string
  type: PlayGroupingType
}

const playGroupingTypes: PlayGroupingType[] = [
  "Run (No QB Read)",
  "RPO",
  "Pass",
  "Screen",
  "Designed QB Run (No Reads)",
  "Designed QB Run (With Read)",
  "PRO (Pass Run Option)",
]

const examples = [
  {
    title: "Quick Game",
    type: "Pass",
    description: "Quick-hitting pass concepts for timing-based throws.",
  },
  {
    title: "4 WR Bottom-Up Dropback Game",
    type: "Pass",
    description: "Progressive read passing concepts from short to deep routes with 4 WRs.",
  },
  {
    title: "OZ Base RPO",
    type: "RPO",
    description: "Outside zone runs with built-in pass options based on defense.",
  },
  {
    title: "RB Screen",
    type: "Screen",
    description: "Screen plays for a RB.",
  },
  {
    title: "Pin + Pull",
    type: "Run (No QB Read)",
    description: "Pin + Pull plays. Groups like this can make study of your run game seamless.",
  }
]

const initialState = {
  error: "",
  success: false,
}

function ExampleCard({ title, type, description }: ExampleCardProps) {
  return (
    <div className="px-2 py-3 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors">
      <h3 className="text-sm font-medium text-neutral-950">{title}</h3>
      <p className="mt-1 text-xs text-neutral-700">{type}</p>
      <p className="mt-2 text-sm text-neutral-500">{description}</p>
    </div>
  )
}

interface ExampleCardProps {
  title: string
  type: string
  description: string
}

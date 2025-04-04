"use client"

import Accordion from "@/components/Accordian"
import Combobox, { type ComboBoxRef } from "@/components/Combobox"
import ComboboxWKeys from "@/components/ComboboxWKeys"
import DefaultButton from "@/components/DefaultButton"
import MultilineInput from "@/components/MultilineInput"
import MultiTagSelect, { type MultiTagSelectRef, type TagOption } from "@/components/MultiTagSelect"
import TextInput from "@/components/TextInput"
import YesNoToggle from "@/components/YesNoToggle"
import { getVisibleFields } from "@/types/fieldVisibilityConfig"
import {
  playExeuctionLevelsConst,
  type PlayGrouping,
  type PlayGroupingType,
  type PlayResult,
  playResultsConst,
} from "@/types/gameTypes"
import type { PracticeBlock } from "@/types/practiceTypes"
import type { SeasonQB, SeasonRB } from "@/types/seasonType"
import { useActionState, useCallback, useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { logPlayOnPractice } from "./practiceActions"

function usePlayPersistence() {
  interface PlayState {
    filmNumber: string
  }

  const [previousPlay, setPreviousPlay] = useState<PlayState>({
    filmNumber: "",
  })

  const updatePlayState = useCallback((formData: FormData) => {
    const filmNumber = formData.get("filmNumber") as string
    const newFilmNumber = (Number.parseInt(filmNumber) + 1).toString()

    setPreviousPlay({
      filmNumber: newFilmNumber
    })
  }, [])

  return { previousPlay, updatePlayState }
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <DefaultButton
      text={pending ? "Logging..." : "Log Play"}
      className="mt-4 w-full"
      type="submit"
      disabled={pending}
    />
  )
}

export default function LogPracticePlay({
  seasonQBs,
  seasonRBs,
  playGroupings,
  practiceId,
  practiceBlocks,
  tags,
}: {
  seasonQBs: SeasonQB[]
  seasonRBs: SeasonRB[]
  playGroupings: PlayGrouping[]
  practiceId: number
  practiceBlocks: PracticeBlock[]
  tags: TagOption[]
}) {
  const [playType, setPlayType] = useState<string>("")
  const [playResult, setPlayResult] = useState<PlayResult | "">("")
  const [audibleOpportunityMissed, setAudibleOpportunityMissed] = useState<boolean>(false)
  const [audibleCalled, setAudibleCalled] = useState<boolean>(false)
  const [audibleSuccess, setAudibleSuccess] = useState<boolean>(false)
  const [rpoReadMade, setRpoReadMade] = useState<boolean>(true)
  const [readOptionReadKeys, setReadOptionReadKeys] = useState<boolean>(true)
  const [sackOnQB, setSackOnQB] = useState<boolean>(false)

  const initialState = { error: "", success: false }
  const { previousPlay, updatePlayState } = usePlayPersistence()

  const handleAction = async (state: { error: string; success: boolean } | null, formData: FormData) => {
    const result = await logPlayOnPractice(state || { error: "", success: false }, formData)

    if (result && result.success) {
      updatePlayState(formData)
    }

    return result
  }

  const [state, formAction] = useActionState(
    (state: { error: string; success: boolean } | null, formData: FormData) => handleAction(state, formData),
    initialState,
  )

  const qbComboboxRef = useRef<ComboBoxRef>(null)
  const rbComboboxRef = useRef<ComboBoxRef>(null)
  const blockComboboxRef = useRef<ComboBoxRef>(null)
  const playGroupingComboboxRef = useRef<ComboBoxRef>(null)
  const resultComboboxRef = useRef<ComboBoxRef>(null)
  const rbVisionExecutionRef = useRef<ComboBoxRef>(null)
  const rbRunExecutionRef = useRef<ComboBoxRef>(null)
  const pocketPresenceRef = useRef<ComboBoxRef>(null)
  const passReadExecutionRef = useRef<ComboBoxRef>(null)
  const passBallPlacementRef = useRef<ComboBoxRef>(null)
  const scrambleExecutionRef = useRef<ComboBoxRef>(null)
  const qbRunExecutionRef = useRef<ComboBoxRef>(null)
  const tagsSelectRef = useRef<MultiTagSelectRef>(null)

  const formRef = useRef<HTMLFormElement>(null)

  const filmNumberRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (previousPlay.filmNumber && formRef.current) {
      if (filmNumberRef.current) filmNumberRef.current.value = previousPlay.filmNumber
    }
  }, [previousPlay, state?.success])

  const resetForm = useCallback(() => {
    setPlayType("")
    setPlayResult("")
    setAudibleOpportunityMissed(false)
    setAudibleCalled(false)
    setAudibleSuccess(false)
    setRpoReadMade(true)
    setReadOptionReadKeys(true)
    setSackOnQB(false)

    if (formRef.current) {
      const comboboxRefs = [
        qbComboboxRef,
        rbComboboxRef,
        blockComboboxRef,
        playGroupingComboboxRef,
        resultComboboxRef,
        rbVisionExecutionRef,
        rbRunExecutionRef,
        pocketPresenceRef,
        passReadExecutionRef,
        passBallPlacementRef,
        scrambleExecutionRef,
        qbRunExecutionRef,
      ]

      comboboxRefs.forEach((ref) => {
        if (ref.current) {
          try {
            ref.current.reset()
          } catch (e) {
            console.error("Error resetting combobox:", e)
          }
        }
      })

      if (tagsSelectRef.current) {
        try {
          tagsSelectRef.current.reset()
        } catch (e) {
          console.error("Error resetting tags:", e)
        }
      }

      try {
        const elements = Array.from(formRef.current.elements)
        for (const element of elements) {
          const input = element as HTMLInputElement
          if (
            input.name &&
            input.name !== "practiceId" &&
            input.name !== "filmNumber" &&
            input.name !== "at" &&
            input.name !== "down" &&
            input.name !== "distance"
          ) {
            input.value = ""
          }
        }
      } catch (e) {
        console.error("Error clearing form inputs:", e)
      }

      if (previousPlay.filmNumber) {
        if (filmNumberRef.current) filmNumberRef.current.value = previousPlay.filmNumber
      }
    }
  }, [previousPlay])

  useEffect(() => {
    if (state?.success) {
      resetForm()
    }
  }, [state?.success, resetForm])

  return (
    <Accordion title="Log Play" defaultOpen={false}>
      <form className="p-3 bg-white text-sm" action={formAction} ref={formRef}>
        <input type="hidden" name="practiceId" value={practiceId} />
        <div className="md:grid md:grid-cols-3 md:gap-1 lg:grid lg:grid-cols-12 lg:gap-1 space-y-2 lg:space-y-0">
          <div className="lg:col-span-2 lg:flex lg:items-center">
            <div className="w-full">
              <ComboboxWKeys
                label="QB"
                id="qb"
                name="qb"
                options={seasonQBs?.map((qb) => ({ label: qb.name, value: qb.id.toString() })) || []}
                defaultSelected={seasonQBs?.find((qb) => qb.is_starter)?.id.toString()}
                required
              />
            </div>
          </div>
          <div className="lg:col-span-2 lg:flex lg:items-center">
            <div className="w-full">
              <ComboboxWKeys
                label="Practice Block"
                id="practiceBlock"
                name="practiceBlock"
                options={practiceBlocks?.map((block) => ({ label: block.name, value: block.id.toString() })) || []}
                required
                ref={blockComboboxRef}
              />
            </div>
          </div>
          <div className="lg:col-span-1 lg:flex lg:items-center lg:gap-0.5">
            <div>
              <TextInput
                id="filmNumber"
                name="filmNumber"
                label="Hudl #"
                placeholder="14"
                type="number"
                required
                ref={filmNumberRef}
              />
            </div>
          </div>
          <div className="lg:col-span-2 lg:flex lg:items-center lg:gap-0.5">
            <div className="w-full">
              <TextInput id="playCall" name="playCall" label="Play Call" placeholder="Sprout" type="text" required />
            </div>
            <div className="w-full">
              <TextInput id="playCallTags" name="playCallTags" label="Call Tags" placeholder="F Lingo" type="text" />
            </div>
          </div>
          <div className="lg:col-span-2 lg:flex lg:items-center">
            <div className="w-full">
              <ComboboxWKeys
                key={`play-grouping-${state?.success ? Date.now() : "default"}`}
                label="Play Grouping"
                id="playGrouping"
                name="playGrouping"
                placeholder="Select..."
                onChange={(value) => {
                  const selectedPlayGrouping = playGroupings.find((pg) => pg.id.toString() === value)
                  setPlayType(selectedPlayGrouping ? selectedPlayGrouping.type.toString() : "")
                }}
                options={
                  playGroupings?.map((pg) => ({
                    label: pg.name,
                    value: pg.id.toString(),
                  })) || []
                }
                required
                ref={playGroupingComboboxRef}
              />
            </div>
          </div>
          <div className="lg:col-span-2 lg:flex lg:items-center">
            <div className="w-full">
              <Combobox
                key={`result-${state?.success ? Date.now() : "default"}`}
                label="Result"
                id="result"
                name="result"
                options={playResultsConst?.map((result) => result)}
                onChange={(value) => setPlayResult(value as PlayResult)}
                required
                ref={resultComboboxRef}
              />
            </div>
          </div>
          <div className="lg:col-span-1 lg:flex lg:items-center">
            <div className="w-full">
              <TextInput id="yardsGained" name="yardsGained" label="Yards" placeholder="7" type="number" required />
            </div>
          </div>
        </div>
        <div className="md:grid md:grid-cols-3 md:gap-1 lg:grid lg:grid-cols-12 lg:gap-1 space-y-2 md:space-y-0 mt-4">
          {getVisibleFields(playType as PlayGroupingType, playResult as PlayResult).map((field) => {
            // Convert snake_case from config to camelCase for component matching
            const camelField = field.replace(/_([a-z])/g, (match, p1) => p1.toUpperCase())

            return (
              <div key={field} className="lg:col-span-2">
                {camelField === "rpoReadKeys" && (
                  <YesNoToggle label="RPO Read Made" value={rpoReadMade} onChange={setRpoReadMade} name="rpoReadKeys" />
                )}
                {camelField === "rbIn" && (
                  <ComboboxWKeys
                    label="RB"
                    id="rb"
                    name="rb"
                    placeholder="Select RB..."
                    options={
                      seasonRBs?.map((rb) => ({
                        label: rb.name,
                        value: rb.id.toString(),
                      })) || []
                    }
                    defaultSelected={seasonRBs?.find((rb) => rb.is_starter)?.id.toString()}
                    ref={rbComboboxRef}
                  />
                )}
                {camelField === "rbVision" && (
                  <Combobox
                    label="RB Vision Grade"
                    id="rbVision"
                    name="rbVision"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    ref={rbVisionExecutionRef}
                  />
                )}
                {camelField === "rbRunExecution" && (
                  <Combobox
                    label="RB Run Grade"
                    id="rbRunExecution"
                    name="rbRunExecution"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    ref={rbRunExecutionRef}
                  />
                )}
                {camelField === "pocketPresence" && (
                  <Combobox
                    label="Pocket Presence Grade"
                    id="pocketPresence"
                    name="pocketPresence"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    ref={pocketPresenceRef}
                  />
                )}
                {camelField === "passRead" && (
                  <Combobox
                    label="Pass Read Grade"
                    id="passRead"
                    name="passRead"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    ref={passReadExecutionRef}
                  />
                )}
                {camelField === "readOptionReadKeys" && (
                  <YesNoToggle
                    label="Read Key(s)"
                    value={readOptionReadKeys}
                    onChange={setReadOptionReadKeys}
                    name="readOptionReadKeys"
                  />
                )}
                {camelField === "passBallPlacement" && (
                  <Combobox
                    label="Pass Ball Placement Grade"
                    id="passBallPlacement"
                    name="passBallPlacement"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    ref={passBallPlacementRef}
                  />
                )}
                {camelField === "qbRun" && (
                  <Combobox
                    label="QB Run Grade"
                    id="qbRun"
                    name="qbRun"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    ref={qbRunExecutionRef}
                  />
                )}
                {camelField === "qbRunExecution" && (
                  <Combobox
                    label="QB Run Grade"
                    id="qbRunExecution"
                    name="qbRunExecution"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    ref={qbRunExecutionRef}
                  />
                )}
                {camelField === "scrambleExecution" && (
                  <Combobox
                    label="Scramble Grade"
                    id="scrambleExecution"
                    name="scrambleExecution"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    ref={scrambleExecutionRef}
                  />
                )}
                {camelField === "sackOnQb" && (
                  <YesNoToggle label="Sack on QB" value={sackOnQB} onChange={setSackOnQB} name="sackOnQb" />
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-3 mb-1 text-neutral-500 text-xs italic cursor-default">Optional Fields</div>
        <div className="lg:grid lg:grid-cols-12 lg:gap-4 space-y-2 lg:space-y-0">
          <div className="lg:col-span-2">
            <p className="text-neutral-800 font-medium cursor-default">Audibles</p>
            <YesNoToggle
              label="Audible Opp. Missed"
              value={audibleOpportunityMissed}
              onChange={setAudibleOpportunityMissed}
              name="audibleOpportunityMissed"
            />
            <YesNoToggle
              label="Audible Called"
              value={audibleCalled}
              onChange={setAudibleCalled}
              name="audibleCalled"
              className="mt-2"
            />
            {audibleCalled && (
              <YesNoToggle
                label="Audible Correct"
                value={audibleSuccess}
                onChange={setAudibleSuccess}
                name="audibleSuccess"
                className="mt-2"
              />
            )}
          </div>
          <div className="lg:col-span-5">
            <MultilineInput
              id="notes"
              name="notes"
              label="Notes"
              placeholder="Enter any additional notes about the play..."
            />
          </div>
          <div className="lg:col-span-5">
            <MultiTagSelect
              label="Tags"
              id="tags"
              name="tags"
              options={tags}
              placeholder="Add tags..."
              ref={tagsSelectRef}
            />
          </div>
        </div>
        <SubmitButton />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
    </Accordion>
  )
}


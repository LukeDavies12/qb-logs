"use client"

import MultilineInput from "@/components/MultilineInput"
import { useRef, useState, useCallback, useEffect, useActionState } from "react"
import { useFormStatus } from "react-dom"
import type { SeasonQB, SeasonRB } from "@/types/seasonType"
import {
  playExeuctionLevelsConst,
  type PlayGrouping,
  type PlayGroupingType,
  type PlayResult,
  playResultsConst,
} from "@/types/gameTypes"
import Combobox, { type ComboBoxRef } from "@/components/Combobox"
import TextInput from "@/components/TextInput"
import { getVisibleFields } from "@/types/fieldVisibilityConfig"
import DefaultButton from "@/components/DefaultButton"
import { logPlayOnGame } from "../gameActions"
import ComboboxWKeys from "@/components/ComboboxWKeys"
import Accordion from "@/components/Accordian"
import MultiTagSelect, { type MultiTagSelectRef, type TagOption } from "@/components/MultiTagSelect"
import YesNoToggle from "@/components/YesNoToggle"

function usePlayPersistence() {
  interface PlayState {
    driveNum: string
    filmNumber: string
    at: string
    down: string
    distance: string
  }

  const [previousPlay, setPreviousPlay] = useState<PlayState>({
    driveNum: "",
    filmNumber: "",
    at: "",
    down: "",
    distance: "",
  })

  const updatePlayState = useCallback((formData: FormData) => {
    const driveNum = formData.get("driveNum") as string
    const filmNumber = formData.get("filmNumber") as string
    const at = formData.get("at") as string
    const down = formData.get("down") as string
    const distance = formData.get("distance") as string
    const yardsGained = formData.get("yardsGained") as string
    const result = formData.get("result") as PlayResult

    // For TD, Interception, or Fumble, reset the form completely
    if (result.includes("TD") || result === "Interception" || result === "Fumble") {
      setPreviousPlay({
        driveNum: "",
        filmNumber: "",
        at: "",
        down: "",
        distance: "",
      })
      return
    }

    // Continue with the existing logic for other play results
    const atValue = Number.parseInt(at)
    const yardsGainedValue = Number.parseInt(yardsGained)
    const downValue = Number.parseInt(down)
    const distanceValue = Number.parseInt(distance)

    const newAt = atValue + yardsGainedValue

    let newDown = downValue
    let newDistance = distanceValue
    let newDriveNum = driveNum
    const newAtPosition = newAt

    if (result === "Penalty") {
      // Keep existing logic for penalties
    } else {
      if (yardsGainedValue >= distanceValue) {
        newDown = 1
        newDistance = 10
      } else {
        newDown = downValue + 1
        newDistance = distanceValue - yardsGainedValue

        if (newDown > 4) {
          newDown = 1
          newDistance = 10
          newDriveNum = (Number.parseInt(driveNum) + 1).toString()
        }
      }
    }

    const newFilmNumber = (Number.parseInt(filmNumber) + 1).toString()

    setPreviousPlay({
      driveNum: newDriveNum,
      filmNumber: newFilmNumber,
      at: newAtPosition.toString(),
      down: newDown.toString(),
      distance: newDistance.toString(),
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

export default function LogGamePlayWithAccordion({
  seasonQBs,
  seasonRBs,
  playGroupings,
  gameId,
  tags,
}: {
  seasonQBs?: SeasonQB[]
  seasonRBs?: SeasonRB[]
  playGroupings: PlayGrouping[]
  gameId: number
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
    const result = await logPlayOnGame(state, formData)

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

  const driveNumRef = useRef<HTMLInputElement>(null)
  const filmNumberRef = useRef<HTMLInputElement>(null)
  const atRef = useRef<HTMLInputElement>(null)
  const downRef = useRef<HTMLInputElement>(null)
  const distanceRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Only populate the form fields if previousPlay has values and we're not coming from a TD/INT/Fumble
    if (previousPlay.driveNum && formRef.current) {
      if (driveNumRef.current) driveNumRef.current.value = previousPlay.driveNum
      if (filmNumberRef.current) filmNumberRef.current.value = previousPlay.filmNumber
      if (atRef.current) atRef.current.value = previousPlay.at
      if (downRef.current) downRef.current.value = previousPlay.down
      if (distanceRef.current) distanceRef.current.value = previousPlay.distance
    }
  }, [previousPlay, state?.success])

  const resetForm = useCallback(() => {
    // Reset all state variables
    setPlayType("")
    setPlayResult("")
    setAudibleOpportunityMissed(false)
    setAudibleCalled(false)
    setAudibleSuccess(false)
    setRpoReadMade(true)
    setReadOptionReadKeys(true)
    setSackOnQB(false)

    if (formRef.current) {
      // Reset all combobox refs explicitly
      const comboboxRefs = [
        qbComboboxRef,
        rbComboboxRef,
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

      // Reset all comboboxes
      comboboxRefs.forEach((ref) => {
        if (ref.current) {
          try {
            ref.current.reset()
          } catch (e) {
            console.error("Error resetting combobox:", e)
          }
        }
      })

      // Reset tag select
      if (tagsSelectRef.current) {
        try {
          tagsSelectRef.current.reset()
        } catch (e) {
          console.error("Error resetting tags:", e)
        }
      }

      // Clear form inputs except game ID
      try {
        const elements = Array.from(formRef.current.elements)
        for (const element of elements) {
          const input = element as HTMLInputElement
          if (
            input.name &&
            input.name !== "gameId" &&
            input.name !== "driveNum" &&
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

      // Re-apply the updated previousPlay values after clearing the form
      if (previousPlay.driveNum) {
        if (driveNumRef.current) driveNumRef.current.value = previousPlay.driveNum
        if (filmNumberRef.current) filmNumberRef.current.value = previousPlay.filmNumber
        if (atRef.current) atRef.current.value = previousPlay.at
        if (downRef.current) downRef.current.value = previousPlay.down
        if (distanceRef.current) distanceRef.current.value = previousPlay.distance
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
      <form className="p-4 bg-white text-sm" action={formAction} ref={formRef}>
        <input type="hidden" name="gameId" value={gameId} />
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
          <div className="lg:col-span-3 lg:flex lg:items-center lg:gap-0.5">
            <div>
              <TextInput
                id="driveNum"
                name="driveNum"
                label="Drive #"
                placeholder="1"
                type="number"
                required
                ref={driveNumRef}
              />
            </div>
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
            <div>
              <TextInput id="at" name="at" label="At" placeholder="-18" type="number" required ref={atRef} />
            </div>
            <div>
              <TextInput id="down" name="down" label="Down" placeholder="1" type="number" required ref={downRef} />
            </div>
            <div>
              <TextInput
                id="distance"
                name="distance"
                label="Dist"
                placeholder="10"
                type="number"
                required
                ref={distanceRef}
              />
            </div>
          </div>
          <div className="lg:col-span-2 lg:flex lg:items-center lg:gap-0.5">
            <div>
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
        <div className="md:grid md:grid-cols-3 md:gap-1 lg:grid lg:grid-cols-12 lg:gap-4 space-y-2 md:space-y-0 mt-4">
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
                    required
                    ref={rbComboboxRef}
                  />
                )}
                {camelField === "rbVision" && (
                  <Combobox
                    label="RB Vision Grade"
                    id="rbVision"
                    name="rbVision"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    required
                    ref={rbVisionExecutionRef}
                  />
                )}
                {camelField === "rbRunExecution" && (
                  <Combobox
                    label="RB Run Grade"
                    id="rbRunExecution"
                    name="rbRunExecution"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    required
                    ref={rbRunExecutionRef}
                  />
                )}
                {camelField === "pocketPresence" && (
                  <Combobox
                    label="Pocket Presence Grade"
                    id="pocketPresence"
                    name="pocketPresence"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    required
                    ref={pocketPresenceRef}
                  />
                )}
                {camelField === "passRead" && (
                  <Combobox
                    label="Pass Read Grade"
                    id="passRead"
                    name="passRead"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    required
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
                    required
                    ref={passBallPlacementRef}
                  />
                )}
                {camelField === "qbRun" && (
                  <Combobox
                    label="QB Run Grade"
                    id="qbRun"
                    name="qbRun"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    required
                    ref={qbRunExecutionRef}
                  />
                )}
                {camelField === "qbRunExecution" && (
                  <Combobox
                    label="QB Run Grade"
                    id="qbRunExecution"
                    name="qbRunExecution"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    required
                    ref={qbRunExecutionRef}
                  />
                )}
                {camelField === "scrambleExecution" && (
                  <Combobox
                    label="Scramble Grade"
                    id="scrambleExecution"
                    name="scrambleExecution"
                    options={playExeuctionLevelsConst?.map((level) => level) || []}
                    required
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


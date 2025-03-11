"use client"

import MultilineInput from "@/components/MultilineInput"
import { useRef, useState, useEffect } from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import type { SeasonQB, SeasonRB } from "@/types/seasonType"
import type { PlayGrouping, PlayGroupingType } from "@/types/playGroupingTypes"
import { playExeuctionLevelsConst, type PlayResult, playResultsConst, type GamePlay } from "@/types/gameTypes"
import Combobox, { type ComboBoxRef } from "@/components/Combobox"
import TextInput from "@/components/TextInput"
import { getVisibleFields } from "@/types/fieldVisibilityConfig"
import DefaultButton from "@/components/DefaultButton"
import { updatePlayOnGame } from "../gameActions"
import ComboboxWKeys from "@/components/ComboboxWKeys"
import MultiTagSelect, { type MultiTagSelectRef, type TagOption } from "@/components/MultiTagSelect"
import YesNoToggle from "@/components/YesNoToggle"

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <DefaultButton
      text={pending ? "Updating..." : "Update Play"}
      className="mt-4 w-full"
      type="submit"
      disabled={pending || disabled}
    />
  )
}

export default function UpdatePlayForm({
  play,
  seasonQBs,
  seasonRBs,
  playGroupings,
  gameId,
  tags,
  driveNum,
  setIsModalOpen,
}: {
  play: GamePlay
  seasonQBs?: SeasonQB[]
  seasonRBs?: SeasonRB[]
  playGroupings: PlayGrouping[]
  gameId: number
  tags: TagOption[]
  driveNum: number
  setIsModalOpen: (isOpen: boolean) => void
}) {
  const initialPlayType = play.play_grouping_type?.type.toString() || ""
  const initialPlayResult = play.result || ""

  const [playType, setPlayType] = useState<string>(initialPlayType)
  const [playResult, setPlayResult] = useState<PlayResult | "">(initialPlayResult)
  const [audibleOpportunityMissed, setAudibleOpportunityMissed] = useState<boolean>(
    play.audible_opportunity_missed || false,
  )
  const [audibleCalled, setAudibleCalled] = useState<boolean>(play.audible_called || false)
  const [audibleSuccess, setAudibleSuccess] = useState<boolean>(play.audible_success || false)
  const [rpoReadMade, setRpoReadMade] = useState<boolean>(play.rpo_read_keys || true)
  const [readOptionReadKeys, setReadOptionReadKeys] = useState<boolean>(play.read_option_read_keys || true)
  const [sackOnQB, setSackOnQB] = useState<boolean>(play.sack_on_qb || false)
  const [formModified, setFormModified] = useState<boolean>(false)
  const [selectedTags, setSelectedTags] = useState<TagOption[]>(
    play.tags?.map((tag) => ({
      id: tag.tag_id,
      name: tag.name,
      team_id: tag.team_id,
    })) || [],
  )

  // Track combobox values in state
  const [qbValue, setQbValue] = useState<string>(play.qb_in_id.toString())
  const [rbValue, setRbValue] = useState<string>(play.rb_carry_id?.toString() || "")
  const [playGroupingValue, setPlayGroupingValue] = useState<string>(play.play_grouping_id.toString())
  const [resultValue, setResultValue] = useState<string>(play.result || "")
  const [rbVisionValue, setRbVisionValue] = useState<string>(play.rb_vision || "")
  const [rbRunExecutionValue, setRbRunExecutionValue] = useState<string>(play.rb_run_execution || "")
  const [pocketPresenceValue, setPocketPresenceValue] = useState<string>(play.pocket_presence || "")
  const [passReadValue, setPassReadValue] = useState<string>(play.pass_read || "")
  const [passBallPlacementValue, setPassBallPlacementValue] = useState<string>(play.pass_ball_placement || "")
  const [qbRunExecutionValue, setQbRunExecutionValue] = useState<string>(play.qb_run_execution || "")
  const [scrambleExecutionValue, setScrambleExecutionValue] = useState<string>(play.scramble_execution || "")

  const initialState = { error: "", success: false }

  const [state, formAction] = useActionState(updatePlayOnGame, initialState)

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

  // Convert play tags to the format expected by MultiTagSelect
  const initialTags =
    play.tags?.map((tag) => ({
      id: tag.tag_id,
      name: tag.name,
      team_id: tag.team_id,
    })) || []

  // Create a snapshot of the initial form state for comparison
  const initialFormState = {
    qb_in_id: play.qb_in_id.toString(),
    drive_num: driveNum.toString(),
    film_number: play.film_number.toString(),
    yard_line: play.yard_line.toString(),
    down: play.down.toString(),
    distance: play.distance.toString(),
    play_call: play.play_call,
    play_call_tags: play.play_call_tags || "",
    play_grouping_id: play.play_grouping_id.toString(),
    result: play.result,
    yards_gained: play.yards_gained.toString(),
    rb_carry_id: play.rb_carry_id?.toString() || "",
    rb_vision: play.rb_vision || "",
    rb_run_execution: play.rb_run_execution || "",
    pocket_presence: play.pocket_presence || "",
    pass_read: play.pass_read || "",
    pass_ball_placement: play.pass_ball_placement || "",
    qb_run_execution: play.qb_run_execution || "",
    scramble_execution: play.scramble_execution || "",
    audible_opportunity_missed: play.audible_opportunity_missed || false,
    audible_called: play.audible_called || false,
    audible_success: play.audible_success || false,
    rpo_read_keys: play.rpo_read_keys || true,
    read_option_read_keys: play.read_option_read_keys || true,
    sack_on_qb: play.sack_on_qb || false,
    notes: play.notes || "",
    tags: JSON.stringify(initialTags.map((tag) => tag.id).sort()),
  }

  // Function to check if the form has been modified
  const checkFormModified = () => {
    if (!formRef.current) return false

    const formData = new FormData(formRef.current)
    const currentFormState: Record<string, any> = {}

    // Extract values from form data
    formData.forEach((value, key) => {
      // Map form field names to state keys if needed
      if (key === "driveNum") {
        currentFormState.drive_num = value
      } else if (key === "filmNumber") {
        currentFormState.film_number = value
      } else if (key === "playCall") {
        currentFormState.play_call = value
      } else if (key === "playCallTags") {
        currentFormState.play_call_tags = value
      } else if (key === "yardsGained") {
        currentFormState.yards_gained = value
      } else if (key === "at") {
        currentFormState.yard_line = value
      } else {
        currentFormState[key] = value
      }
    })

    // Add combobox values from state
    currentFormState.qb_in_id = qbValue
    currentFormState.rb_carry_id = rbValue
    currentFormState.play_grouping_id = playGroupingValue
    currentFormState.result = resultValue
    currentFormState.rb_vision = rbVisionValue
    currentFormState.rb_run_execution = rbRunExecutionValue
    currentFormState.pocket_presence = pocketPresenceValue
    currentFormState.pass_read = passReadValue
    currentFormState.pass_ball_placement = passBallPlacementValue
    currentFormState.qb_run_execution = qbRunExecutionValue
    currentFormState.scramble_execution = scrambleExecutionValue

    // Add boolean values that might not be in form data
    currentFormState.audible_opportunity_missed = audibleOpportunityMissed
    currentFormState.audible_called = audibleCalled
    currentFormState.audible_success = audibleSuccess
    currentFormState.rpo_read_keys = rpoReadMade
    currentFormState.read_option_read_keys = readOptionReadKeys
    currentFormState.sack_on_qb = sackOnQB

    // Add tags
    currentFormState.tags = JSON.stringify(selectedTags.map((tag) => tag.id).sort())

    // Compare current state with initial state
    for (const key in initialFormState) {
      if (Object.prototype.hasOwnProperty.call(initialFormState, key)) {
        // Skip hidden fields
        if (key === "gameId" || key === "playId" || key === "driveId") continue

        const initialValue = initialFormState[key as keyof typeof initialFormState]
        const currentValue = currentFormState[key]

        // If any value is different, the form has been modified
        if (initialValue !== currentValue && currentValue !== undefined) {
          console.log(`Form modified: ${key} changed from ${initialValue} to ${currentValue}`)
          return true
        }
      }
    }

    return false
  }

  // Set up form change detection
  useEffect(() => {
    const handleFormChange = () => {
      setFormModified(checkFormModified())
    }

    const form = formRef.current
    if (form) {
      // Run the check immediately after mounting
      setTimeout(() => {
        handleFormChange()
      }, 0)

      form.addEventListener("input", handleFormChange)
      form.addEventListener("change", handleFormChange)

      return () => {
        form.removeEventListener("input", handleFormChange)
        form.removeEventListener("change", handleFormChange)
      }
    }
  }, [
    audibleOpportunityMissed,
    audibleCalled,
    audibleSuccess,
    rpoReadMade,
    readOptionReadKeys,
    sackOnQB,
    selectedTags,
    // Add combobox values to dependency array
    qbValue,
    rbValue,
    playGroupingValue,
    resultValue,
    rbVisionValue,
    rbRunExecutionValue,
    pocketPresenceValue,
    passReadValue,
    passBallPlacementValue,
    qbRunExecutionValue,
    scrambleExecutionValue,
  ])

  // Ensure form starts as unmodified
  useEffect(() => {
    setFormModified(false)
  }, [])

  // Add this effect to close the modal after successful update
  useEffect(() => {
    if (state?.success) {
      // Wait for 150ms to show the success message before closing
      const timer = setTimeout(() => {
        setIsModalOpen(false)
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [state?.success, setIsModalOpen])

  return (
    <form className="p-2 bg-white text-sm" action={formAction} ref={formRef}>
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="playId" value={play.id} />
      <input type="hidden" name="driveId" value={play.drive_id} />

      <div className="md:grid md:grid-cols-3 md:gap-1 lg:grid lg:grid-cols-12 lg:gap-1 space-y-2 lg:space-y-0">
        <div className="lg:col-span-2 lg:flex lg:items-center">
          <div className="w-full">
            <ComboboxWKeys
              label="QB"
              id="qb"
              name="qb"
              options={seasonQBs?.map((qb) => ({ label: qb.name, value: qb.id.toString() })) || []}
              defaultSelected={play.qb_in_id.toString()}
              onChange={(value) => setQbValue(value)}
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
              defaultValue={driveNum.toString()}
              type="number"
              required
            />
          </div>
          <div>
            <TextInput
              id="filmNumber"
              name="filmNumber"
              label="Hudl #"
              defaultValue={play.film_number.toString()}
              type="number"
              required
            />
          </div>
          <div>
            <TextInput id="at" name="at" label="At" defaultValue={play.yard_line.toString()} type="number" required />
          </div>
          <div>
            <TextInput id="down" name="down" label="Down" defaultValue={play.down.toString()} type="number" required />
          </div>
          <div>
            <TextInput
              id="distance"
              name="distance"
              label="Dist"
              defaultValue={play.distance.toString()}
              type="number"
              required
            />
          </div>
        </div>
        <div className="lg:col-span-2 lg:flex lg:items-center lg:gap-0.5">
          <div className="w-full">
            <TextInput
              id="playCall"
              name="playCall"
              label="Play Call"
              defaultValue={play.play_call}
              type="text"
              required
            />
          </div>
          <div className="w-full">
            <TextInput
              id="playCallTags"
              name="playCallTags"
              label="Call Tags"
              defaultValue={play.play_call_tags || ""}
              type="text"
            />
          </div>
        </div>
        <div className="lg:col-span-2 lg:flex lg:items-center">
          <div className="w-full">
            <ComboboxWKeys
              label="Play Grouping"
              id="playGrouping"
              name="playGrouping"
              placeholder="Select..."
              onChange={(value) => {
                const selectedPlayGrouping = playGroupings.find((pg) => pg.id.toString() === value)
                setPlayType(selectedPlayGrouping ? selectedPlayGrouping.type.toString() : "")
                setPlayGroupingValue(value)
              }}
              options={
                playGroupings?.map((pg) => ({
                  label: pg.name,
                  value: pg.id.toString(),
                })) || []
              }
              defaultSelected={play.play_grouping_id.toString()}
              required
              ref={playGroupingComboboxRef}
            />
          </div>
        </div>
        <div className="lg:col-span-2 lg:flex lg:items-center">
          <div className="w-full">
            <Combobox
              label="Result"
              id="result"
              name="result"
              options={playResultsConst?.map((result) => result)}
              onChange={(value) => {
                setPlayResult(value as PlayResult)
                setResultValue(value)
              }}
              defaultValue={play.result}
              required
              ref={resultComboboxRef}
            />
          </div>
        </div>
        <div className="lg:col-span-1 lg:flex lg:items-center">
          <div className="w-full">
            <TextInput
              id="yardsGained"
              name="yardsGained"
              label="Yards"
              defaultValue={play.yards_gained.toString()}
              type="number"
              required
            />
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
                  defaultSelected={play.rb_carry_id?.toString()}
                  onChange={(value) => setRbValue(value)}
                  ref={rbComboboxRef}
                />
              )}
              {camelField === "rbVision" && (
                <Combobox
                  label="RB Vision Grade"
                  id="rbVision"
                  name="rbVision"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.rb_vision || undefined}
                  onChange={(value) => setRbVisionValue(value)}
                  ref={rbVisionExecutionRef}
                />
              )}
              {camelField === "rbRunExecution" && (
                <Combobox
                  label="RB Run Grade"
                  id="rbRunExecution"
                  name="rbRunExecution"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.rb_run_execution || undefined}
                  onChange={(value) => setRbRunExecutionValue(value)}
                  ref={rbRunExecutionRef}
                />
              )}
              {camelField === "pocketPresence" && (
                <Combobox
                  label="Pocket Presence Grade"
                  id="pocketPresence"
                  name="pocketPresence"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.pocket_presence || undefined}
                  onChange={(value) => setPocketPresenceValue(value)}
                  ref={pocketPresenceRef}
                />
              )}
              {camelField === "passRead" && (
                <Combobox
                  label="Pass Read Grade"
                  id="passRead"
                  name="passRead"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.pass_read || undefined}
                  onChange={(value) => setPassReadValue(value)}
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
                  defaultValue={play.pass_ball_placement || undefined}
                  onChange={(value) => setPassBallPlacementValue(value)}
                  ref={passBallPlacementRef}
                />
              )}
              {camelField === "qbRunExecution" && (
                <Combobox
                  label="QB Run Grade"
                  id="qbRunExecution"
                  name="qbRunExecution"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.qb_run_execution || undefined}
                  onChange={(value) => setQbRunExecutionValue(value)}
                  ref={qbRunExecutionRef}
                />
              )}
              {camelField === "scrambleExecution" && (
                <Combobox
                  label="Scramble Grade"
                  id="scrambleExecution"
                  name="scrambleExecution"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.scramble_execution || undefined}
                  onChange={(value) => setScrambleExecutionValue(value)}
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
            onChange={(value) => {
              setAudibleOpportunityMissed(value)
            }}
            name="audibleOpportunityMissed"
          />
          <YesNoToggle
            label="Audible Called"
            value={audibleCalled}
            onChange={(value) => {
              setAudibleCalled(value)
            }}
            name="audibleCalled"
            className="mt-2"
          />
          {audibleCalled && (
            <YesNoToggle
              label="Audible Correct"
              value={audibleSuccess}
              onChange={(value) => {
                setAudibleSuccess(value)
              }}
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
            defaultValue={play.notes || ""}
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
            defaultSelected={initialTags}
            onChange={(tags) => setSelectedTags(tags)}
            ref={tagsSelectRef}
          />
        </div>
      </div>
      <SubmitButton disabled={!formModified} />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600 mt-2">Play updated successfully!</p>}
    </form>
  )
}


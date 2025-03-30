"use client"

import type React from "react"

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
  playResultsConst,
  type GamePlay,
  type PlayGrouping,
  type PlayGroupingType,
  type PlayResult,
} from "@/types/gameTypes"
import type { SeasonQB, SeasonRB } from "@/types/seasonType"
import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import { useFormStatus } from "react-dom"
import { updatePlayOnGame } from "../gameActions"

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
  console.log("UpdatePlayForm", play)
  const initialPlayType = play.play_grouping_type?.type.toString() || ""
  const initialPlayResult = play.result || ""

  const [playType, setPlayType] = useState<string>(initialPlayType)
  const [playResult, setPlayResult] = useState<PlayResult | "">(initialPlayResult)
  const [audibleOpportunityMissed, setAudibleOpportunityMissed] = useState<boolean>(
    play.audible_opportunity_missed || false,
  )
  const [audibleCalled, setAudibleCalled] = useState<boolean>(play.audible_called || false)
  const [audibleSuccess, setAudibleSuccess] = useState<boolean>(play.audible_success || false)
  // Fix the initial state values for RPO and read option fields
  const [rpoReadMade, setRpoReadMade] = useState<boolean>(play.rpo_read_keys === true || play.rpo_read_keys === null)
  const [readOptionReadKeys, setReadOptionReadKeys] = useState<boolean>(
    play.read_option_read_keys === true || play.read_option_read_keys === null,
  )
  const [sackOnQB, setSackOnQB] = useState<boolean>(play.sack_on_qb || false)
  // Initialize formModified to false explicitly
  const [formModified, setFormModified] = useState<boolean>(false)
  const [selectedTags, setSelectedTags] = useState<TagOption[]>(
    play.tags?.map((tag) => ({
      id: tag.tag_id,
      name: tag.name,
      team_id: tag.team_id,
    })) || [],
  )

  // Store initial values for comparison
  const initialRpoReadMade = play.rpo_read_keys === true || play.rpo_read_keys === null
  const initialReadOptionReadKeys = play.read_option_read_keys === true || play.read_option_read_keys === null
  const initialAudibleOpportunityMissed = play.audible_opportunity_missed || false
  const initialAudibleCalled = play.audible_called || false
  const initialAudibleSuccess = play.audible_success || false
  const initialSackOnQB = play.sack_on_qb || false

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
  const initialRenderRef = useRef(true) // Create ref outside of useEffect

  const initialTags =
    play.tags?.map((tag) => ({
      id: tag.tag_id,
      name: tag.name,
      team_id: tag.team_id,
    })) || []

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

  // Update the checkFormModified function to handle null values correctly
  const checkFormModified = () => {
    // For boolean fields that can be null, treat null as true (default value)
    if (
      (play.rpo_read_keys === null && !rpoReadMade) ||
      (play.rpo_read_keys !== null && rpoReadMade !== play.rpo_read_keys)
    ) {
      console.log("RPO Read Keys changed", play.rpo_read_keys, rpoReadMade)
      return true
    }

    if (
      (play.read_option_read_keys === null && !readOptionReadKeys) ||
      (play.read_option_read_keys !== null && readOptionReadKeys !== play.read_option_read_keys)
    ) {
      console.log("Read Option Keys changed", play.read_option_read_keys, readOptionReadKeys)
      return true
    }

    if (audibleOpportunityMissed !== initialAudibleOpportunityMissed) {
      return true
    }

    if (audibleCalled !== initialAudibleCalled) {
      return true
    }

    if (audibleSuccess !== initialAudibleSuccess) {
      return true
    }

    if (sackOnQB !== initialSackOnQB) {
      return true
    }

    // Check combobox values
    if (qbValue !== play.qb_in_id.toString()) {
      return true
    }

    if (rbValue !== (play.rb_carry_id?.toString() || "")) {
      return true
    }

    if (playGroupingValue !== play.play_grouping_id.toString()) {
      return true
    }

    if (resultValue !== (play.result || "")) {
      return true
    }

    if (rbVisionValue !== (play.rb_vision || "")) {
      return true
    }

    if (rbRunExecutionValue !== (play.rb_run_execution || "")) {
      return true
    }

    if (pocketPresenceValue !== (play.pocket_presence || "")) {
      return true
    }

    if (passReadValue !== (play.pass_read || "")) {
      return true
    }

    if (passBallPlacementValue !== (play.pass_ball_placement || "")) {
      return true
    }

    if (qbRunExecutionValue !== (play.qb_run_execution || "")) {
      return true
    }

    if (scrambleExecutionValue !== (play.scramble_execution || "")) {
      return true
    }

    const initialTagIds = initialTags
      .map((tag) => tag.id)
      .sort()
      .join(",")
    const currentTagIds = selectedTags
      .map((tag) => tag.id)
      .sort()
      .join(",")
    if (initialTagIds !== currentTagIds) {
      console.log("Tags changed")
      return true
    }

    if (!formRef.current) return false

    const formData = new FormData(formRef.current)

    const driveNumValue = formData.get("updateDriveNum")
    if (driveNumValue && driveNumValue.toString() !== driveNum.toString()) {
      console.log("Drive Number changed")
      return true
    }

    const filmNumberValue = formData.get("updateFilmNumber")
    if (filmNumberValue && filmNumberValue.toString() !== play.film_number.toString()) {
      console.log("Film Number changed")
      return true
    }

    const atValue = formData.get("updateAt")
    if (atValue && atValue.toString() !== play.yard_line.toString()) {
      console.log("Yard Line changed")
      return true
    }

    const downValue = formData.get("updateDown")
    if (downValue && downValue.toString() !== play.down.toString()) {
      console.log("Down changed")
      return true
    }

    const distanceValue = formData.get("updateDistance")
    if (distanceValue && distanceValue.toString() !== play.distance.toString()) {
      console.log("Distance changed")
      return true
    }

    const playCallValue = formData.get("updatePlayCall")
    if (playCallValue && playCallValue.toString() !== play.play_call) {
      console.log("Play Call changed")
      return true
    }

    const playCallTagsValue = formData.get("updatePlayCallTags")
    if (playCallTagsValue && playCallTagsValue.toString() !== (play.play_call_tags || "")) {
      console.log("Play Call Tags changed")
      return true
    }

    const yardsGainedValue = formData.get("updateYardsGained")
    if (yardsGainedValue && yardsGainedValue.toString() !== play.yards_gained.toString()) {
      console.log("Yards Gained changed")
      return true
    }

    const notesValue = formData.get("updateNotes")
    if (notesValue && notesValue.toString() !== (play.notes || "")) {
      console.log("Notes changed")
      return true
    }

    return false
  }

  useEffect(() => {
    const isModified = checkFormModified()
    console.log("Form modified check:", isModified)
    setFormModified(isModified)
  }, [
    audibleOpportunityMissed,
    audibleCalled,
    audibleSuccess,
    rpoReadMade,
    readOptionReadKeys,
    sackOnQB,
    selectedTags,
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

  useEffect(() => {
    if (state?.success) {
      // Wait for 150ms to show the success message before closing
      const timer = setTimeout(() => {
        setIsModalOpen(false)
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [state?.success, setIsModalOpen])

  // Add a loading state to track when the form is being submitted
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Modify the handleSubmit function to double-check if the form is modified
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Force a final check to ensure the form is actually modified
    const isActuallyModified = checkFormModified()

    if (!isActuallyModified) {
      console.log("Form not modified, preventing submission")
      return
    }

    console.log("Form is modified, allowing submission")
    setIsSubmitting(true)

    const form = e.target as HTMLFormElement
    startTransition(() => {
      formAction(new FormData(form))
    })
  }

  const [isPending, startTransition] = useTransition()

  return (
    <form className="p-2 bg-white text-sm" action={formAction} ref={formRef} onSubmit={handleSubmit}>
      <input type="hidden" name="updateGameId" value={gameId} />
      <input type="hidden" name="updatePlayId" value={play.id} />
      <input type="hidden" name="updateDriveId" value={play.drive_id} />

      <div className="md:grid md:grid-cols-3 md:gap-1 lg:grid lg:grid-cols-12 lg:gap-1 space-y-2 lg:space-y-0">
        <div className="lg:col-span-2 lg:flex lg:items-center">
          <div className="w-full">
            <ComboboxWKeys
              label="QB"
              id="updateQb"
              name="updateQb"
              options={seasonQBs?.map((qb) => ({ label: qb.name, value: qb.id.toString() })) || []}
              defaultSelected={play.qb_in_id.toString()}
              onChange={(value) => {
                setQbValue(value)
                setFormModified(checkFormModified())
              }}
              required
            />
          </div>
        </div>
        <div className="lg:col-span-3 lg:flex lg:items-center lg:gap-0.5">
          <div>
            <TextInput
              id="updateDriveNum"
              name="updateDriveNum"
              label="Drive #"
              defaultValue={driveNum.toString()}
              type="number"
              required
            />
          </div>
          <div>
            <TextInput
              id="updateFilmNumber"
              name="updateFilmNumber"
              label="Hudl #"
              defaultValue={play.film_number.toString()}
              type="number"
              required
            />
          </div>
          <div>
            <TextInput
              id="updateAt"
              name="updateAt"
              label="At"
              defaultValue={play.yard_line.toString()}
              type="number"
              required
            />
          </div>
          <div>
            <TextInput
              id="updateDown"
              name="updateDown"
              label="Down"
              defaultValue={play.down.toString()}
              type="number"
              required
            />
          </div>
          <div>
            <TextInput
              id="updateDistance"
              name="updateDistance"
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
              id="updatePlayCall"
              name="updatePlayCall"
              label="Play Call"
              defaultValue={play.play_call}
              type="text"
              required
            />
          </div>
          <div className="w-full">
            <TextInput
              id="updatePlayCallTags"
              name="updatePlayCallTags"
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
              id="updatePlayGrouping"
              name="updatePlayGrouping"
              placeholder="Select..."
              onChange={(value) => {
                const selectedPlayGrouping = playGroupings.find((pg) => pg.id.toString() === value)
                const newPlayType = selectedPlayGrouping ? selectedPlayGrouping.type.toString() : ""

                if (newPlayType !== playType) {
                  setSackOnQB(false)
                  setRpoReadMade(false)
                  setReadOptionReadKeys(false)
                  setAudibleOpportunityMissed(false)
                  setAudibleCalled(false)
                  setAudibleSuccess(false)

                  setPocketPresenceValue("")
                  setPassReadValue("")
                  setPassBallPlacementValue("")
                  setScrambleExecutionValue("")
                  setQbRunExecutionValue("")
                  setRbVisionValue("")
                  setRbRunExecutionValue("")

                  if (pocketPresenceRef.current) pocketPresenceRef.current.reset()
                  if (passReadExecutionRef.current) passReadExecutionRef.current.reset()
                  if (passBallPlacementRef.current) passBallPlacementRef.current.reset()
                  if (scrambleExecutionRef.current) scrambleExecutionRef.current.reset()
                  if (qbRunExecutionRef.current) qbRunExecutionRef.current.reset()
                  if (rbVisionExecutionRef.current) rbVisionExecutionRef.current.reset()
                  if (rbRunExecutionRef.current) rbRunExecutionRef.current.reset()
                }

                setPlayType(newPlayType)
                setPlayGroupingValue(value)

                // Don't call checkFormModified directly, let the useEffect handle it
                // The state update will trigger the useEffect
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
              id="updateResult"
              name="updateResult"
              options={playResultsConst?.map((result) => result)}
              onChange={(value) => {
                setPlayResult(value as PlayResult)
                setResultValue(value)
                setFormModified(checkFormModified())
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
              id="updateYardsGained"
              name="updateYardsGained"
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
                <YesNoToggle
                  label="RPO Read Made"
                  value={rpoReadMade}
                  onChange={(value) => {
                    console.log("RPO Read Made changed from", rpoReadMade, "to", value)
                    setRpoReadMade(value)
                    setFormModified(checkFormModified())
                  }}
                  name="updateRpoReadKeys"
                />
              )}
              {camelField === "rbIn" && (
                <ComboboxWKeys
                  label="RB"
                  id="updateRb"
                  name="updateRb"
                  placeholder="Select RB..."
                  options={
                    seasonRBs?.map((rb) => ({
                      label: rb.name,
                      value: rb.id.toString(),
                    })) || []
                  }
                  defaultSelected={play.rb_carry_id?.toString()}
                  onChange={(value) => {
                    setRbValue(value)
                    setFormModified(checkFormModified())
                  }}
                  ref={rbComboboxRef}
                />
              )}
              {camelField === "rbVision" && (
                <Combobox
                  label="RB Vision Grade"
                  id="updateRbVision"
                  name="updateRbVision"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.rb_vision || undefined}
                  onChange={(value) => {
                    setRbVisionValue(value)
                    setFormModified(checkFormModified())
                  }}
                  ref={rbVisionExecutionRef}
                />
              )}
              {camelField === "rbRunExecution" && (
                <Combobox
                  label="RB Run Grade"
                  id="updateRbRunExecution"
                  name="updateRbRunExecution"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.rb_run_execution || undefined}
                  onChange={(value) => {
                    setRbRunExecutionValue(value)
                    setFormModified(checkFormModified())
                  }}
                  ref={rbRunExecutionRef}
                />
              )}
              {camelField === "pocketPresence" && (
                <Combobox
                  label="Pocket Presence Grade"
                  id="updatePocketPresence"
                  name="updatePocketPresence"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.pocket_presence || undefined}
                  onChange={(value) => {
                    setPocketPresenceValue(value)
                    setFormModified(checkFormModified())
                  }}
                  ref={pocketPresenceRef}
                />
              )}
              {camelField === "passRead" && (
                <Combobox
                  label="Pass Read Grade"
                  id="updatePassRead"
                  name="updatePassRead"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.pass_read || undefined}
                  onChange={(value) => {
                    setPassReadValue(value)
                    setFormModified(checkFormModified())
                  }}
                  ref={passReadExecutionRef}
                />
              )}
              {camelField === "readOptionReadKeys" && (
                <YesNoToggle
                  label="Read Key(s)"
                  value={readOptionReadKeys}
                  onChange={(value) => {
                    setReadOptionReadKeys(value)
                    setFormModified(checkFormModified())
                  }}
                  name="updateReadOptionReadKeys"
                />
              )}
              {camelField === "passBallPlacement" && (
                <Combobox
                  label="Pass Ball Placement Grade"
                  id="updatePassBallPlacement"
                  name="updatePassBallPlacement"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.pass_ball_placement || undefined}
                  onChange={(value) => {
                    setPassBallPlacementValue(value)
                    setFormModified(checkFormModified())
                  }}
                  ref={passBallPlacementRef}
                />
              )}
              {camelField === "qbRunExecution" && (
                <Combobox
                  label="QB Run Grade"
                  id="updateQbRunExecution"
                  name="updateQbRunExecution"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.qb_run_execution || undefined}
                  onChange={(value) => {
                    setQbRunExecutionValue(value)
                    setFormModified(checkFormModified())
                  }}
                  ref={qbRunExecutionRef}
                />
              )}
              {camelField === "scrambleExecution" && (
                <Combobox
                  label="Scramble Grade"
                  id="updateScrambleExecution"
                  name="updateScrambleExecution"
                  options={playExeuctionLevelsConst?.map((level) => level) || []}
                  defaultValue={play.scramble_execution || undefined}
                  onChange={(value) => {
                    setScrambleExecutionValue(value)
                    setFormModified(checkFormModified())
                  }}
                  ref={scrambleExecutionRef}
                />
              )}
              {camelField === "sackOnQb" && (
                <YesNoToggle
                  label="Sack on QB"
                  value={sackOnQB}
                  onChange={(value) => {
                    setSackOnQB(value)
                    setFormModified(checkFormModified())
                  }}
                  name="updateSackOnQb"
                />
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
              setFormModified(checkFormModified())
            }}
            name="updateAudibleOpportunityMissed"
          />
          <YesNoToggle
            label="Audible Called"
            value={audibleCalled}
            onChange={(value) => {
              setAudibleCalled(value)
              setFormModified(checkFormModified())
            }}
            name="updateAudibleCalled"
            className="mt-2"
          />
          {audibleCalled && (
            <YesNoToggle
              label="Audible Correct"
              value={audibleSuccess}
              onChange={(value) => {
                setAudibleSuccess(value)
                setFormModified(checkFormModified())
              }}
              name="updateAudibleSuccess"
              className="mt-2"
            />
          )}
        </div>
        <div className="lg:col-span-5">
          <MultilineInput
            id="updateNotes"
            name="updateNotes"
            label="Notes"
            defaultValue={play.notes || ""}
            placeholder="Enter any additional notes about the play..."
          />
        </div>
        <div className="lg:col-span-5">
          <MultiTagSelect
            label="Tags"
            id="updateTags"
            name="updateTags"
            options={tags}
            placeholder="Add tags..."
            defaultSelected={initialTags}
            onChange={(tags) => {
              setSelectedTags(tags)
              setFormModified(checkFormModified())
            }}
            ref={tagsSelectRef}
          />
        </div>
      </div>
      <SubmitButton disabled={!formModified || isSubmitting} />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600 mt-2">Play updated successfully!</p>}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <p className="text-center font-medium">Updating play...</p>
          </div>
        </div>
      )}
    </form>
  )
}


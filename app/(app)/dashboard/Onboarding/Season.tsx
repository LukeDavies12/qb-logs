"use client"

import { XIcon } from "lucide-react"
import React, { useActionState, useRef, useState } from "react"

import Alert from "@/components/Alert"
import CheckboxInput from "@/components/CheckboxInput"
import ComboBox, { ComboBoxRef } from "@/components/Combobox"
import DateInput from "@/components/DateInput"
import DefaultButton from "@/components/DefaultButton"
import SecondaryButton from "@/components/SecondaryButton"
import TextInput from "@/components/TextInput"
import { SeasonType } from "@/types/seasonType"
import { ActionStateSeason, createSeasonAction } from "./onboardActions"

export default function SeasonOnboardingForm() {
  const [state, action, isPending] = useActionState(async (prevState: ActionStateSeason, formData: FormData) => {
    return await createSeasonAction(prevState, formData);
  }, { error: "", success: false, inputs: {} });
  const [qbFormError, setQbFormError] = useState(false)
  const [rbFormError, setRbFormError] = useState(false)
  const [qbErrorMessage, setQbErrorMessage] = useState("")
  const [rbErrorMessage, setRbErrorMessage] = useState("")
  const [seasonQBs, setSeasonQBs] = useState<PlayerInputs[]>([])
  const [seasonRBs, setSeasonRBs] = useState<PlayerInputs[]>([])

  const error = state?.error || null
  const inputs = state?.inputs || {}

  const handleAddSeasonQB = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent, yearRef: React.RefObject<ComboBoxRef>) => {
    e.preventDefault()
  
    const nameInput = document.querySelector('#qb-player-form [name="name"]') as HTMLInputElement
    const numberInput = document.querySelector('#qb-player-form [name="number"]') as HTMLInputElement
    const yearSelect = document.querySelector('#qb-player-form [name="year"]') as HTMLSelectElement
    const isActiveCheckbox = document.querySelector('#qb-player-form [name="is_active"]') as HTMLInputElement
    const isStarterCheckbox = document.querySelector('#qb-player-form [name="is_starter"]') as HTMLInputElement
  
    if (!nameInput || !numberInput || !yearSelect) {
      setQbFormError(true)
      setQbErrorMessage("Please fill out all required fields")
      return
    }
  
    const name = nameInput.value
    const numberValue = numberInput.value
    const year = yearSelect.value
    const is_active = isActiveCheckbox ? isActiveCheckbox.checked : true
    const is_starter = isStarterCheckbox ? isStarterCheckbox.checked : false
  
    if (!name || !numberValue || !year) {
      setQbFormError(true)
      setQbErrorMessage("Please fill out all required fields")
      return
    }
  
    const number = Number.parseInt(numberValue)
  
    const isDuplicate = seasonQBs.some(
      (player) => player.name.toLowerCase() === name.toLowerCase() && player.number === number,
    )
    if (isDuplicate) {
      setQbFormError(true)
      setQbErrorMessage("This QB has already been added")
      return
    }
  
    if (is_starter && seasonQBs.some(qb => qb.is_starter)) {
      setQbFormError(true)
      setQbErrorMessage("Only one starting QB is allowed")
      return
    }
  
    setSeasonQBs((prev) => [...prev, { name, number, year, is_active, is_starter }])
    setQbFormError(false)
    setQbErrorMessage("")
  
    nameInput.value = ""
    numberInput.value = ""
    
    if (yearRef.current) {
      yearRef.current.reset()
    }
    
    if (isActiveCheckbox) isActiveCheckbox.checked = true
    if (isStarterCheckbox) isStarterCheckbox.checked = false
  }

  const handleAddSeasonRB = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent, yearRef: React.RefObject<ComboBoxRef>) => {
    e.preventDefault()
  
    const nameInput = document.querySelector('#rb-player-form [name="name"]') as HTMLInputElement
    const numberInput = document.querySelector('#rb-player-form [name="number"]') as HTMLInputElement
    const yearSelect = document.querySelector('#rb-player-form [name="year"]') as HTMLSelectElement
    const isActiveCheckbox = document.querySelector('#rb-player-form [name="is_active"]') as HTMLInputElement
    const isStarterCheckbox = document.querySelector('#rb-player-form [name="is_starter"]') as HTMLInputElement
  
    if (!nameInput || !numberInput || !yearSelect) {
      setRbFormError(true)
      setRbErrorMessage("Please fill out all required fields")
      return
    }
  
    const name = nameInput.value
    const numberValue = numberInput.value
    const year = yearSelect.value
    const is_active = isActiveCheckbox ? isActiveCheckbox.checked : true
    const is_starter = isStarterCheckbox ? isStarterCheckbox.checked : false
  
    if (!name || !numberValue || !year) {
      setRbFormError(true)
      setRbErrorMessage("Please fill out all required fields")
      return
    }
  
    const number = Number.parseInt(numberValue)
  
    const isDuplicate = seasonRBs.some(
      (player) => player.name.toLowerCase() === name.toLowerCase() && player.number === number,
    )
    if (isDuplicate) {
      setRbFormError(true)
      setRbErrorMessage("This RB has already been added")
      return
    }
  
    if (is_starter && seasonRBs.some(rb => rb.is_starter)) {
      setRbFormError(true)
      setRbErrorMessage("Only one starting RB is allowed")
      return
    }
  
    setSeasonRBs((prev) => [...prev, { name, number, year, is_active, is_starter }])
    setRbFormError(false)
    setRbErrorMessage("")
  
    nameInput.value = ""
    numberInput.value = ""
    
    if (yearRef.current) {
      yearRef.current.reset()
    }
    
    if (isActiveCheckbox) isActiveCheckbox.checked = true
    if (isStarterCheckbox) isStarterCheckbox.checked = false
  }

  const handleRemoveQB = (index: number) => {
    setSeasonQBs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveRB = (index: number) => {
    setSeasonRBs((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-neutral-900">Step 2: Create a Season</h2>
        <p className="mt-1 text-base text-neutral-500">Set your QBs + RBs, then choose a game to get started with</p>
      </div>
      {error && <Alert message={error} type="error" />}
      <form action={action} className="space-y-6">
        <div className="space-y-6 mb-4">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:w-1/2">
            <TextInput
              label="Year"
              name="season_year"
              id="season_year"
              type="number"
              placeholder="Enter year"
              defaultValue={inputs.season_year?.toString() || "2024"}
              required
              error={error?.includes("year")}
            />
            <ComboBox
              label="Fall Season or Spring Ball"
              name="season_type"
              id="season_type"
              options={seasonTypes}
              required
              error={error?.includes("type")}
              defaultValue={inputs.season_type as SeasonType | undefined}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center">
                <h3 className="text-sm font-medium text-neutral-900">Season QBs</h3>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full">
                  {seasonQBs.length}
                </span>
              </div>
              <PlayerForm
                playerType="QB"
                handleAddPlayer={handleAddSeasonQB}
                formError={qbFormError}
                errorMessage={qbErrorMessage}
                hasStarter={seasonQBs.some(qb => qb.is_starter)}
              />
              <PlayerList
                players={seasonQBs}
                handleRemovePlayer={handleRemoveQB}
                playerType="QB"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <h3 className="text-sm font-medium text-neutral-900">Season RBs</h3>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full">
                  {seasonRBs.length}
                </span>
              </div>
              <PlayerForm
                playerType="RB"
                handleAddPlayer={handleAddSeasonRB}
                formError={rbFormError}
                errorMessage={rbErrorMessage}
                hasStarter={seasonRBs.some(rb => rb.is_starter)}
              />
              <PlayerList
                players={seasonRBs}
                handleRemovePlayer={handleRemoveRB}
                playerType="RB"
              />
            </div>
          </div>
        </div>
        <div className="space-y-6 mb-4">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:w-1/2">
            <DateInput
              label="Game Date"
              name="game_date"
              required
              error={error?.includes("date")}
              defaultValue={inputs.game_date as string}
            />
            <TextInput
              label="Against"
              name="game_against"
              id="game_against"
              type="text"
              placeholder="Enter opponent"
              required
              error={error?.includes("opponent")}
              defaultValue={inputs.game_against as string}
            />
          </div>
        </div>
        <input type="hidden" name="season_qbs" value={JSON.stringify(seasonQBs)} />
        <input type="hidden" name="season_rbs" value={JSON.stringify(seasonRBs)} />
        <DefaultButton
          type="submit"
          text={isPending ? "Completing..." : "Complete Setup"}
          className="w-full"
          disabled={isPending || seasonQBs.length === 0 || seasonRBs.length === 0}
        />
      </form>
    </div>
  )
}

interface PlayerInputs {
  name: string
  number: number
  year: string
  is_active: boolean
  is_starter: boolean
}

const seasonTypes: SeasonType[] = ["Fall", "Spring"]
const playerYears = [
  "Freshman",
  "Redshirt Freshman",
  "Sophomore",
  "Redshirt Sophomore",
  "Junior",
  "Redshirt Junior",
  "Senior",
  "Redshirt Senior"
]

function PlayerForm({
  playerType,
  handleAddPlayer,
  formError,
  errorMessage,
  hasStarter
}: {
  playerType: 'QB' | 'RB';
  handleAddPlayer: (e: React.FormEvent<HTMLFormElement> | React.MouseEvent, yearRef: React.RefObject<ComboBoxRef>) => void;
  formError: boolean;
  errorMessage: string;
  hasStarter: boolean;
}) {
  const [isStarterChecked, setIsStarterChecked] = useState(false);
  const yearRef = useRef<ComboBoxRef>({} as ComboBoxRef);
  
  React.useEffect(() => {
    if (hasStarter) {
      setIsStarterChecked(false);
    }
  }, [hasStarter]);
  const formId = `${playerType.toLowerCase()}-player-form`;

  // This prevents the "Add Player" button from submitting the main form
  const onAddPlayer = (e: React.MouseEvent) => {
    e.preventDefault(); // Stop event propagation
    e.stopPropagation(); // Ensure it doesn't bubble up
    handleAddPlayer(e, yearRef);
  };

  return (
    <div
      id={formId}
      className="flex flex-col space-y-3 p-4 rounded-lg border border-neutral-200 bg-white"
    >
      <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-2">
        <div className="lg:col-span-3">
          <TextInput 
            label="Name" 
            name="name" 
            type="text"
            id="name"
            placeholder={`${playerType} name`} 
            required={false}
            error={formError} 
          />
        </div>
        <div className="flex gap-2 lg:col-span-6">
          <div className="w-16 flex-shrink-0">
            <TextInput 
              label="Number" 
              name="number" 
              type="number" 
              id="number"
              placeholder="#" 
              required={false}
              error={formError} 
            />
          </div>
          <div className="flex-1 lg:col">
            <ComboBox 
              ref={yearRef} 
              label="Year" 
              name="year" 
              id="year"
              options={playerYears} 
              required={false} // Changed from required to required={false}
              error={formError} 
            />
          </div>
        </div>
        <div className="hidden lg:flex lg:flex-col lg:justify-end lg:col-span-3 lg:pb-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <CheckboxInput
                id={`${playerType.toLowerCase()}-is-active`}
                name="is_active"
                label="Active"
                defaultChecked={true}
              />
            </div>
            <div className="flex items-center">
              <CheckboxInput
                id={`${playerType.toLowerCase()}-is-starter`}
                name="is_starter"
                label="Starter"
                disabled={hasStarter}
                defaultChecked={isStarterChecked}
                onChange={(e) => setIsStarterChecked(e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2 lg:hidden">
        <div className="flex items-center">
          <CheckboxInput
            id={`mobile-${playerType.toLowerCase()}-is-active`}
            name="is_active"
            label="Active"
            defaultChecked={true}
          />
        </div>
        <div className="flex items-center">
          <CheckboxInput
            id={`mobile-${playerType.toLowerCase()}-is-starter`}
            name="is_starter"
            label="Starter"
            disabled={hasStarter}
          />
        </div>
      </div>
      {formError && errorMessage && (
        <div className="text-xs text-red-500 mt-1">{errorMessage}</div>
      )}
      <div className="flex justify-between items-center pt-2 border-t border-neutral-100 mt-2">
        <span className="text-xs font-medium text-neutral-500">{playerType} Information</span>
        <SecondaryButton
          type="button"
          text={`Add ${playerType}`}
          className="h-9"
          onClick={onAddPlayer}
        />
      </div>
    </div>
  );
}

function PlayerList({
  players,
  handleRemovePlayer,
  playerType
}: {
  players: any[];
  handleRemovePlayer: (index: number) => void;
  playerType: string;
}) {
  if (players.length === 0) return null;

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-neutral-700">Added {playerType}s</h4>
        <span className="text-xs text-neutral-500">{players.length} total</span>
      </div>
      <div className="space-y-2 max-h-[210px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent hover:scrollbar-thumb-neutral-300">
        {players.map((player, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-3 py-2.5 rounded-md border border-neutral-200 hover:border-neutral-300 transition-colors duration-150"
          >
            <div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-neutral-900">#{player.number}</span>
                <span className="text-sm font-medium text-neutral-900 ml-2">{player.name}</span>
                {player.is_starter && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Starter
                  </span>
                )}
                {!player.is_active && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {player.year}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleRemovePlayer(index)}
              className="p-1.5 text-neutral-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors duration-150"
              aria-label={`Remove ${playerType}`}
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
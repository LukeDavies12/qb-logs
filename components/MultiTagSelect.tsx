"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { X } from "lucide-react"

export interface TagOption {
  id: number | null
  name: string
  team_id?: number
}

interface MultiTagSelectProps {
  label: string
  name: string
  options: TagOption[]
  placeholder?: string
  required?: boolean
  error?: boolean
  defaultSelected?: TagOption[]
  onChange?: (selectedTags: TagOption[]) => void
  className?: string
  id?: string
}

export interface MultiTagSelectRef {
  reset: (defaultValue?: TagOption[]) => void
  getSelectedTags: () => TagOption[]
}

const MultiTagSelect = forwardRef(function MultiTagSelect(
  {
    label,
    name,
    options,
    placeholder = "Add tags...",
    required,
    error,
    defaultSelected = [],
    onChange,
    className,
    id,
  }: MultiTagSelectProps,
  ref: React.Ref<MultiTagSelectRef>,
) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<TagOption[]>(defaultSelected)
  const [inputValue, setInputValue] = useState("")
  const [filteredOptions, setFilteredOptions] = useState<TagOption[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const optionsRef = useRef<HTMLLIElement[]>([])
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    updateFilteredOptions()
  }, [options, selectedTags, inputValue])

  const updateFilteredOptions = () => {
    const selectedIds = selectedTags.map((tag) => tag.id)

    let filtered = options.filter(
      (option) => !selectedIds.includes(option.id) && option.name.toLowerCase().includes(inputValue.toLowerCase()),
    )

    if (
      inputValue.trim() !== "" &&
      !filtered.some((option) => option.name.toLowerCase() === inputValue.toLowerCase())
    ) {
      filtered = [{ id: null, name: inputValue }, ...filtered]
    }

    setFilteredOptions(filtered)
  }

  useImperativeHandle(ref, () => ({
    reset: (defaultValue?: TagOption[]) => {
      setSelectedTags(defaultValue || [])
      setInputValue("")
    },
    getSelectedTags: () => selectedTags,
  }))

  const labelClassName = `block text-xs font-medium ${error ? "text-red-700" : "text-neutral-700"} mb-1`

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (option: TagOption) => {
    const newSelectedTags = [...selectedTags, option]
    setSelectedTags(newSelectedTags)
    setInputValue("")
    setIsOpen(false)
    setHighlightedIndex(-1)
    onChange?.(newSelectedTags)

    inputRef.current?.focus()
  }

  const handleRemoveTag = (tagToRemove: TagOption) => {
    const newSelectedTags = selectedTags.filter((tag) => !(tag.id === tagToRemove.id && tag.name === tagToRemove.name))
    setSelectedTags(newSelectedTags)
    onChange?.(newSelectedTags)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && inputValue === "" && selectedTags.length > 0) {
      const newSelectedTags = [...selectedTags]
      newSelectedTags.pop()
      setSelectedTags(newSelectedTags)
      onChange?.(newSelectedTags)
      return
    }

    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsOpen(true)
      setHighlightedIndex(0)
      return
    }

    if (!isOpen) return

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev <= 0 ? filteredOptions.length - 1 : prev - 1))
        break

      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev === filteredOptions.length - 1 ? 0 : prev + 1))
        break

      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex])
        } else if (inputValue.trim() !== "") {
          // Create a new tag if nothing is highlighted but input has content
          handleSelect({ id: null, name: inputValue.trim() })
        }
        break

      case "Escape":
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }, 200)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setIsOpen(true)
    setHighlightedIndex(-1)
  }

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      })
    }
  }, [highlightedIndex])

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor={id || name} className={labelClassName}>
        {label}
      </label>

      <div className="flex flex-wrap items-center gap-1 p-1 bg-neutral-100 rounded-md border border-neutral-200 focus-within:ring-2 focus-within:ring-neutral-500 focus-within:border-transparent">
        {selectedTags.map((tag, index) => (
          <div
            key={`${tag.id}-${index}`}
            className="flex items-center bg-neutral-200 text-neutral-800 rounded px-1 py-1 text-xs"
          >
            <span>{tag.name}</span>
            <button
              type="button"
              className="ml-1 text-neutral-500 hover:text-neutral-700"
              onClick={() => handleRemoveTag(tag)}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <input
          ref={inputRef}
          type="text"
          id={id || name}
          className="flex-grow p-1 bg-transparent border-none outline-none text-sm"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          autoComplete="off"
          aria-invalid={error}
          aria-expanded={isOpen}
          role="combobox"
          aria-controls="tag-options-list"
          aria-activedescendant={highlightedIndex >= 0 ? `tag-option-${highlightedIndex}` : undefined}
        />
      </div>

      <input type="hidden" name={name} value={JSON.stringify(selectedTags)} />

      {isOpen && filteredOptions.length > 0 && (
        <div
          className="absolute z-20 w-full mt-1 bg-white rounded-md shadow-lg border border-neutral-200"
          id="tag-options-list"
          role="listbox"
        >
          <ul className="py-1 max-h-48 overflow-y-auto">
            {filteredOptions.map((option, index) => (
              <li
                key={`${option.id || "new"}-${option.name}-${index}`}
                ref={(el) => {
                  if (el) optionsRef.current[index] = el
                }}
                id={`tag-option-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                className={`px-3 py-2 text-sm cursor-pointer ${
                  highlightedIndex === index ? "bg-neutral-100" : "hover:bg-neutral-50"
                } ${option.id === null ? "text-neutral-950 font-medium" : "text-neutral-600"}`}
                onClick={() => {
                  if (blurTimeoutRef.current) {
                    clearTimeout(blurTimeoutRef.current)
                  }
                  handleSelect(option)
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.id === null ? `Create tag: "${option.name}"` : option.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})

export default MultiTagSelect


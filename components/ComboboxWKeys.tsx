"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"

export interface ComboboxWKeysOption {
  label: string
  value: string
}

interface ComboboxProps {
  label: string
  name: string
  options: ComboboxWKeysOption[]
  placeholder?: string
  required?: boolean
  error?: boolean
  defaultSelected?: string
  onChange?: (value: string) => void
  className?: string
  id?: string
  playGroupings?: any[] // For backward compatibility
}

export interface ComboBoxWKeysRef {
  reset: (defaultValue?: string) => void
}

const ComboboxWKeys = forwardRef(function ComboboxWKeys(
  {
    label,
    name,
    options,
    placeholder = "Select...",
    required,
    error,
    defaultSelected,
    onChange,
    className,
    id,
    playGroupings,
  }: ComboboxProps,
  ref: React.Ref<ComboBoxWKeysRef>,
) {
  // If playGroupings is provided, convert it to the expected format
  const formattedOptions = playGroupings
    ? playGroupings.map((pg) => ({ label: pg.name, value: pg.id.toString() }))
    : options

  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState<string>(defaultSelected || "")
  const [inputValue, setInputValue] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLLIElement[]>([])
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Set the input value based on the selected option's label
  useEffect(() => {
    if (selectedValue) {
      const selectedOption = formattedOptions.find((opt) => opt.value === selectedValue)
      if (selectedOption) {
        setInputValue(selectedOption.label)
      }
    }
  }, [selectedValue, formattedOptions])

  // Initialize with default selected value
  useEffect(() => {
    if (defaultSelected) {
      setSelectedValue(defaultSelected)
      const selectedOption = formattedOptions.find((opt) => opt.value === defaultSelected)
      if (selectedOption) {
        setInputValue(selectedOption.label)
      }
    }
  }, [defaultSelected, formattedOptions])

  // Fix: Use setTimeout to defer state updates to avoid updating during render
  useImperativeHandle(ref, () => ({
    reset: (defaultValue?: string) => {
      if (defaultValue) {
        // When setting to a specific value, we can use setTimeout to be safe
        setTimeout(() => {
          setSelectedValue(defaultValue)
          const selectedOption = formattedOptions.find((opt) => opt.value === defaultValue)
          if (selectedOption) {
            setInputValue(selectedOption.label)
          }
        }, 0)
      } else {
        // When clearing values, we MUST use setTimeout to avoid the React error
        setTimeout(() => {
          setSelectedValue("")
          setInputValue("")
        }, 0)
      }
    },
  }), [formattedOptions])

  const inputClassName = `mt-1 p-2 block w-full sm:text-sm rounded-md ${error
      ? "bg-red-50 text-red-900 placeholder:text-red-300 focus:ring-red-500"
      : "bg-neutral-100 text-neutral-800 placeholder:text-neutral-400 focus:ring-neutral-500"
    } focus:outline-none focus:ring-2 focus:border-transparent hover:bg-neutral-50 active:bg-neutral-50 ${className || ""}`

  const labelClassName = `block text-xs font-medium ${error ? "text-red-700" : "text-neutral-700"}`

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = formattedOptions.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase()),
  )

  const handleSelect = (option: ComboboxWKeysOption) => {
    setSelectedValue(option.value)
    setInputValue(option.label)
    setIsOpen(false)
    setHighlightedIndex(-1)
    onChange?.(option.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && e.key === "ArrowDown") {
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
        }
        break

      case "Escape":
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setHighlightedIndex(-1)

      // If input doesn't match any option, reset to selected value
      if (selectedValue) {
        const selectedOption = formattedOptions.find((opt) => opt.value === selectedValue)
        if (selectedOption) {
          setInputValue(selectedOption.label)
        }
      }
    }, 200)
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
      })
    }
  }, [highlightedIndex])

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor={id || name} className={labelClassName}>
        {label}
      </label>
      <input
        type="text"
        id={id || name}
        className={inputClassName}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          setIsOpen(true)
          setHighlightedIndex(-1)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        aria-invalid={error}
        aria-expanded={isOpen}
        role="combobox"
        aria-controls="options-list"
        aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
      />
      <input type="hidden" name={name} value={selectedValue} />

      {isOpen && (
        <div
          className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-neutral-200"
          id="options-list"
          role="listbox"
        >
          <ul className="py-1 max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  ref={(el) => {
                    if (el) optionsRef.current[index] = el
                  }}
                  id={`option-${index}`}
                  role="option"
                  aria-selected={highlightedIndex === index}
                  className={`px-3 py-2 text-sm text-neutral-700 cursor-pointer ${highlightedIndex === index ? "bg-neutral-100" : "hover:bg-neutral-50"
                    }`}
                  onClick={() => {
                    if (blurTimeoutRef.current) {
                      clearTimeout(blurTimeoutRef.current)
                    }
                    handleSelect(option)
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-neutral-500">No options found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
})

export default ComboboxWKeys

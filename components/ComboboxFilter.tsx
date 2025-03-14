"use client"

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { X } from "lucide-react"

interface ComboBoxFilterProps<T extends string> {
  label: string
  name: string
  options: T[]
  selectedValues: T[]
  onChange: (values: T[]) => void
  className?: string
}

export interface ComboBoxFilterRef {
  reset: () => void;
}

const ComboBoxFilter = forwardRef(function ComboBoxFilter<T extends string>(
  {
    label,
    name,
    options,
    selectedValues,
    onChange,
    className,
  }: ComboBoxFilterProps<T>,
  ref: React.Ref<ComboBoxFilterRef>
) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLLIElement[]>([])
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    reset: () => {
      onChange([])
      setInputValue("")
    }
  }));

  const inputClassName = `p-2 block w-full sm:text-sm rounded-md 
    bg-neutral-100 text-neutral-800 placeholder:text-neutral-600 focus:ring-neutral-500
    focus:outline-none focus:ring-2 focus:border-transparent hover:bg-neutral-50 active:bg-neutral-50 ${className || ""}`

  const labelClassName = "block text-xs font-medium text-neutral-700 mb-1"

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = options
    .filter(option => !selectedValues.includes(option))
    .filter(option => option.toLowerCase().includes(inputValue.toLowerCase()))

  const handleSelect = (value: T) => {
    const newValues = [...selectedValues, value]
    onChange(newValues)
    setInputValue("")
    
    inputRef.current?.focus()
  }

  const handleRemove = (value: T) => {
    const newValues = selectedValues.filter(v => v !== value)
    onChange(newValues)
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
        
      case "Backspace":
        if (inputValue === "" && selectedValues.length > 0) {
          handleRemove(selectedValues[selectedValues.length - 1])
        }
        break
    }
  }

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setHighlightedIndex(-1)
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
      <label htmlFor={name} className={labelClassName}>
        {label}
      </label>
      
      <div className="flex flex-wrap items-center gap-1 p-1 bg-neutral-100 rounded-md border border-neutral-200 focus-within:ring-2 focus-within:ring-neutral-500 focus-within:border-transparent">
        {selectedValues.map((value) => (
          <div 
            key={String(value)}
            className="flex items-center bg-neutral-200 text-neutral-800 rounded px-1 py-1 text-xs"
          >
            <span>{value}</span>
            <button
              type="button"
              className="ml-1 text-neutral-500 hover:text-neutral-700"
              onClick={() => handleRemove(value)}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        <input
          ref={inputRef}
          type="text"
          id={name}
          name={name}
          className="flex-grow p-1 bg-transparent border-none outline-none text-sm"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(-1)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={selectedValues.length === 0 ? `Select ${label.toLowerCase()}...` : ""}
          autoComplete="off"
          role="combobox"
          aria-controls="options-list"
          aria-expanded={isOpen}
          aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
        />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div
          className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-neutral-200"
          id="options-list"
          role="listbox"
        >
          <ul className="py-1 max-h-60 overflow-auto">
            {filteredOptions.map((option, index) => (
              <li
                key={typeof option === 'object' ? JSON.stringify(option) : String(option)}
                ref={(el) => {
                  if (el) optionsRef.current[index] = el
                }}
                id={`option-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                className={`px-3 py-2 text-sm text-neutral-700 cursor-pointer ${
                  highlightedIndex === index ? "bg-neutral-100" : "hover:bg-neutral-50"
                }`}
                onClick={() => {
                  if (blurTimeoutRef.current) {
                    clearTimeout(blurTimeoutRef.current)
                  }
                  handleSelect(option)
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
});

export default ComboBoxFilter;
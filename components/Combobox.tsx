"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"

interface ComboBoxProps<T extends string> {
  label: string
  name: string
  options: T[]
  required?: boolean
  error?: boolean
  defaultValue?: T
  value?: T | ""
  onChange?: (value: T) => void
  className?: string,
  id?: string
}

export interface ComboBoxRef {
  reset: () => void;
}

const ComboBox = forwardRef(function ComboBox<T extends string>(
  {
    label,
    name,
    options,
    required,
    error,
    defaultValue,
    value,
    onChange,
    className,
    id
  }: ComboBoxProps<T>, 
  ref: React.Ref<ComboBoxRef>
) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState<T | "">(value || defaultValue || "")
  const [inputValue, setInputValue] = useState(value || defaultValue || "")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLLIElement[]>([])
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useImperativeHandle(ref, () => ({
    reset: () => {
      setSelectedValue("")
      setInputValue("")
    }
  }));

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
      setInputValue(value)
    }
  }, [value])

  const inputClassName = `mt-1 p-2 block w-full sm:text-sm rounded-md ${
    error
      ? "bg-red-50 text-red-900 placeholder:text-red-300 focus:ring-red-500"
      : "bg-neutral-100 text-neutral-800 placeholder:text-neutral-600 focus:ring-neutral-500"
  } focus:outline-none focus:ring-2 focus:border-transparent hover:bg-neutral-50 active:bg-neutral-50 ${className || ""}`

  const labelClassName = `block text-sm font-medium ${error ? "text-red-700" : "text-neutral-700"}`

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = options.filter((option) => 
    option.toLowerCase().includes((inputValue as string).toLowerCase())
  )

  const handleSelect = (value: T) => {
    setSelectedValue(value)
    setInputValue(value)
    setIsOpen(false)
    setHighlightedIndex(-1)
    onChange?.(value)
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
      <input
        type="text"
        id={id}
        name={name}
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
        placeholder="Select type..."
        autoComplete="off"
        required={required}
        aria-invalid={error}
        aria-expanded={isOpen}
        role="combobox"
        aria-controls="options-list"
        aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
      />
      <input type="hidden" name={`${name}-hidden`} value={selectedValue} />

      {isOpen && (
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

export default ComboBox;
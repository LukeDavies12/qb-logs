"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { ChevronDown } from 'lucide-react'

interface DropdownProps {
  trigger: React.ReactNode
  items: {
    label: string
    onClick: () => void
    className?: string
  }[]
  align?: "left" | "right"
}

export default function Dropdown({ trigger, items, align = "right" }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = useCallback(() => setIsOpen(false), [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, closeDropdown])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={toggleDropdown} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={`absolute z-10 mt-1 py-1 bg-white rounded-md shadow-sm border border-neutral-100 min-w-[140px] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, index) => (
            <button
              key={index}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-50 ${item.className || ""}`}
              onClick={() => {
                item.onClick()
                closeDropdown()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

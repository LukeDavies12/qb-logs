"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { ReactNode } from "react"

export interface DropdownItem {
  label: string
  onClick: () => void
  className?: string
  disabled?: boolean
  icon?: ReactNode
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: "left" | "right"
  className?: string
  itemClassName?: string
}

export default function Dropdown({ 
  trigger, 
  items, 
  align = "right", 
  className = "",
  itemClassName = "" 
}: DropdownProps) {
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
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={toggleDropdown} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <div
          className={`absolute z-30 mt-1 py-1 bg-white rounded-md shadow-sm border border-neutral-100 min-w-[140px] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, index) => (
            <button
              key={index}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-50 ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${item.className || ""} ${itemClassName}`}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick()
                  closeDropdown()
                }
              }}
              disabled={item.disabled}
            >
              <div className="flex items-center gap-2">
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
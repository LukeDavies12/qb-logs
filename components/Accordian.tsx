"use client"

import { type ReactNode, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface AccordionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  titleClassName?: string
  contentClassName?: string
}

export default function Accordion({
  title,
  children,
  defaultOpen = false,
  className = "",
  titleClassName = "",
  contentClassName = "",
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const toggleAccordion = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className={`border border-neutral-200 rounded-md overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={toggleAccordion}
        className={`w-full flex justify-between items-center py-2 px-4 text-neutral-700 bg-neutral-100 text-sm font-medium ${titleClassName}`}
        aria-expanded={isOpen}
      >
        <span className="font-bold">{title}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-neutral-700" />
        ) : (
          <ChevronDown className="h-5 w-5 text-neutral-700" />
        )}
      </button>

      {isOpen && <div className={`${contentClassName}`}>{children}</div>}
    </div>
  )
}


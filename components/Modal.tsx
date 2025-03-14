"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-neutral-900/20 flex items-center justify-center z-50">
      <div ref={modalRef} className={`bg-white rounded-md shadow-sm w-full ${maxWidth} mx-4 overflow-y-scroll`}>
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-100">
          <h3 className="font-medium">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-100">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}


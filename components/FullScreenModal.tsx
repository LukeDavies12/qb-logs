"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import { X } from "lucide-react"
import H2 from "./H2"

interface LargeModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  showCloseButton?: boolean
}

export default function LargeModal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  showCloseButton = true
}: LargeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      
      if ((e.metaKey) && e.key === "Backspace") onClose()
    }
    
    if (isOpen) {
      document.addEventListener("keydown", handleKeydown)
    }
    
    return () => {
      document.removeEventListener("keydown", handleKeydown)
    }
  }, [isOpen, onClose])
  
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick)
    }
    
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/25 z-50">
      <div 
        className="bg-white rounded-lg w-[96%] h-[94%] flex flex-col"
        ref={modalRef}
      >
        <div className="flex justify-between items-center px-6 py-2">
          <H2 text={title} />
          {showCloseButton && (
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-red-50 hover:text-red-700 text-neutral-600"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {children}
        </div>
      </div>
    </div>
  )
}
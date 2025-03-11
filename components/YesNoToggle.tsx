import React from "react"

interface YesNoToggleProps {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  name: string
  className?: string
}

export default function YesNoToggle({ label, value, onChange, name, className = "" }: YesNoToggleProps) {
  return (
    <div className={`flex flex-col items-start justify-between ${className}`}>
      <span className="font-medium text-xs text-neutral-700 cursor-default">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          className={`px-3 py-1 bg-neutral-100 cursor-pointer ${value === false ? "bg-neutral-900 text-white" : ""}`}
          onClick={() => onChange(false)}
        >
          N
        </button>
        <button
          type="button"
          className={`px-3 py-1 bg-neutral-100 cursor-pointer ${value === true ? "bg-neutral-900 text-white" : ""}`}
          onClick={() => onChange(true)}
        >
          Y
        </button>
      </div>
      <input type="hidden" value={value ? "true" : "false"} name={name} />
    </div>
  )
}

"use client"
import { Info } from "lucide-react";
import { useState } from "react";

export default function StatWithTooltip({
  label,
  value,
  description,
  playsOnSchedule,
  totalEligiblePlays,
}: { 
  label: string; 
  value: string | number; 
  description: string;
  playsOnSchedule: number;
  totalEligiblePlays: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  return (
    <div className="py-1 flex flex-col h-full bg-neutral-50 rounded-lg p-4 border border-neutral-100 relative">
      <h3 className="font-semibold text-sm sm:text-base text-neutral-700 min-h-[2.5rem] flex items-center line-clamp-2">
        {label}
        <button
          className="ml-1 text-neutral-400 hover:text-neutral-600 focus:outline-none"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
          aria-label={`Information about ${label}`}
        >
          <Info size={16} />
        </button>
      </h3>
      <div className="text-3xl my-1 font-bold mt-auto">{value}</div>
      <span className="text-xs sm:text-sm font-semibold text-neutral-900">
        {playsOnSchedule} / {totalEligiblePlays}
      </span>
      {showTooltip && (
        <div className="absolute z-10 bg-white border border-neutral-200 shadow-lg rounded-md p-3 text-xs w-64 top-full left-0 mt-1">
          {description}
        </div>
      )}
    </div>
  )
}
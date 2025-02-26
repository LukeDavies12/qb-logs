"use client";

import React, { useState, ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  text: string;
  position?: "top" | "right" | "bottom" | "left";
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  text,
  position = "right",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Position classes mapping
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  };

  return (
    <div className={`relative inline-block ${position === "right" ? "ml-1" : ""}`}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={`absolute z-20 px-2 py-1 text-xs font-medium text-white bg-neutral-800 rounded-md whitespace-nowrap ${positionClasses[position]}`}
        >
          {text}
          {/* Arrow */}
          {position === "right" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-neutral-800"></div>
          )}
          {position === "left" && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 border-4 border-transparent border-l-neutral-800"></div>
          )}
          {position === "top" && (
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1 border-4 border-transparent border-t-neutral-800"></div>
          )}
          {position === "bottom" && (
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 border-4 border-transparent border-b-neutral-800"></div>
          )}
        </div>
      )}
    </div>
  );
};
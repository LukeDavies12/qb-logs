import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface CheckboxInputProps {
  id: string;
  name: string;
  label: string;
  defaultChecked?: boolean;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CheckboxInput({
  id,
  name,
  label,
  defaultChecked = false,
  error = false,
  disabled = false,
  className = '',
  onChange,
}: CheckboxInputProps) {
  const [isChecked, setIsChecked] = useState(defaultChecked);
  const [isFocused, setIsFocused] = useState(false);
  
  useEffect(() => {
    setIsChecked(defaultChecked);
  }, [defaultChecked]);

  const toggleCheckbox = () => {
    if (disabled) return;
    
    const newValue = !isChecked;
    setIsChecked(newValue);
    
    if (onChange) {
      const syntheticEvent = {
        target: {
          type: 'checkbox',
          name,
          id,
          checked: newValue,
          value: newValue ? 'on' : '',
        },
        currentTarget: {
          type: 'checkbox',
          name,
          id,
          checked: newValue,
          value: newValue ? 'on' : '',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleCheckbox();
    }
  };

  const checkboxWrapperClass = `
    flex items-center justify-center
    h-5 w-5 rounded 
    transition-all duration-150
    ${isChecked
      ? error
        ? 'bg-red-600 border-red-600'
        : 'bg-neutral-800 border-neutral-800'
      : 'bg-white border border-neutral-300'
    }
    ${!disabled && !isChecked && 'hover:border-neutral-500'}
    ${isFocused ? 'ring-2 ring-offset-2 ring-neutral-500' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  const labelClass = `
    ml-2 text-sm font-medium
    ${error
      ? 'text-red-700'
      : disabled
        ? 'text-neutral-400'
        : 'text-neutral-700'
    }
    ${!disabled && 'cursor-pointer'}
  `;

  return (
    <div className="flex items-center select-none">
      {/* Hidden actual input for form submission */}
      <input
        type="checkbox"
        id={id}
        name={name}
        className="sr-only"
        checked={isChecked}
        onChange={toggleCheckbox}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      
      {/* Custom checkbox visual */}
      <div
        className={checkboxWrapperClass}
        onClick={toggleCheckbox}
        aria-hidden="true"
      >
        {isChecked && (
          <Check
            className="h-3.5 w-3.5 text-white"
            strokeWidth={3}
          />
        )}
      </div>
      
      <label
        htmlFor={id}
        className={labelClass}
        onClick={(e) => {
          e.preventDefault();
          toggleCheckbox();
        }}
      >
        {label}
      </label>
    </div>
  );
}
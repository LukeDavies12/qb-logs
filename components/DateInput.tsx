import { useState } from 'react';

export default function DateInput({
  label,
  name,
  required,
  error,
  defaultValue,
  className,
  min,
  max,
  onChange
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: boolean;
  defaultValue?: string;
  className?: string;
  min?: string; // Format: YYYY-MM-DD
  max?: string; // Format: YYYY-MM-DD
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue || '');
  
  const labelClassName = `block text-sm font-medium ${
    error ? 'text-red-700' : 'text-neutral-700'
  }`;

  const inputClassName = `
    mt-1 p-2 block w-full sm:text-sm rounded-md
    ${
      error
        ? 'bg-red-50 text-red-900 placeholder:text-red-300 focus:ring-red-500'
        : 'bg-neutral-100 text-neutral-800 placeholder:text-neutral-600 focus:ring-neutral-500'
    }
    focus:outline-none focus:ring-2 focus:border-transparent
    hover:bg-neutral-50 active:bg-neutral-50
    ${className || ''}
  `;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  // Format the date as a readable string for display (e.g., Jan 15, 2023)
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  const formattedValue = formatDate(value);
  
  return (
    <div>
      <div className="flex justify-between">
        <label htmlFor={name} className={labelClassName}>
          {label}
        </label>
        {value && (
          <span className="text-xs text-neutral-500">
            {formattedValue}
          </span>
        )}
      </div>
      <input
        type="date"
        name={name}
        id={name}
        autoComplete="off"
        required={required}
        className={inputClassName}
        aria-invalid={error}
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
      />
    </div>
  );
}
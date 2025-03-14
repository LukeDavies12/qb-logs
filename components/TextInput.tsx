import React, { forwardRef } from "react"

interface TextInputProps {
  label: string
  name: string
  placeholder?: string
  type?: string
  required?: boolean
  error?: boolean
  defaultValue?: string
  className?: string
  id?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      name,
      placeholder,
      type = "text",
      required,
      error,
      defaultValue,
      className,
      id,
      onChange
    }: TextInputProps,
    ref
  ) => {
    const labelClassName = `block text-xs font-medium ${error ? "text-red-700" : "text-neutral-700"}`

    const inputClassName = `
      mt-1 p-2 block w-full sm:text-sm rounded-md
      ${
        error
          ? "bg-red-50 text-red-900 placeholder:text-red-300 focus:ring-red-500"
          : "bg-neutral-100 text-neutral-900 placeholder:text-neutral-400 focus:ring-neutral-500"
      }
      focus:outline-none focus:ring-2 focus:border-transparent
      hover:bg-neutral-50 active:bg-neutral-50
      ${className || ""}
    `

    return (
      <div>
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
        <input
          type={type}
          name={name}
          id={id}
          required={required}
          className={inputClassName}
          placeholder={placeholder}
          aria-invalid={error}
          defaultValue={defaultValue}
          ref={ref}
          onChange={onChange}
        />
      </div>
    )
  }
)

TextInput.displayName = "TextInput"

export default TextInput
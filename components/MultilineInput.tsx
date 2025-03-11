export default function MultilineInput({
  label,
  name,
  placeholder,
  required,
  error,
  defaultValue,
  className,
  id,
  rows = 4,
  onChange
}: {
  label: string
  name: string
  placeholder: string
  required?: boolean
  error?: boolean
  defaultValue?: string
  className?: string
  id?: string
  rows?: number
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}) {
  const labelClassName = `block text-xs font-medium ${error ? "text-red-700" : "text-neutral-700"}`

  const textareaClassName = `
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
      <textarea
        name={name}
        id={id}
        rows={rows}
        required={required}
        className={textareaClassName}
        placeholder={placeholder}
        aria-invalid={error}
        defaultValue={defaultValue}
        onChange={onChange}
      />
    </div>
  )
}


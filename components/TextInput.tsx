export default function TextInput({
  label,
  name,
  type,
  placeholder,
  required,
  error,
  defaultValue,
  className
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
  error?: boolean;
  defaultValue?: string;
  className?: string;
}) {
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

  return (
    <div>
      <label htmlFor={name} className={labelClassName}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        autoComplete="off"
        required={required}
        className={inputClassName}
        placeholder={placeholder}
        aria-invalid={error}
        defaultValue={defaultValue}
      />
    </div>
  );
}
export default function DefaultButton({
  text,
  type,
  className,
  disabled,
}: {
  text: string;
  type: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      className={`
        inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md 
        text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 
        focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neutral-900
        ${className}
      `}
      disabled={disabled}
    >
      {text}
    </button>
  );
}

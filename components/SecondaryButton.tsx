interface SecondaryButtonProps {
  text: string;
  type: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export default function SecondaryButton({
  text,
  type,
  className = '',
  disabled = false,
  onClick,
}: SecondaryButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center px-3 py-1 border w-28 border-gray-300 text-sm rounded-md text-neutral-700 bg-neutral-100 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
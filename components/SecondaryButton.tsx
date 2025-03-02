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
      className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-neutral-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
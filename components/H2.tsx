export default function H2({ text, className } : { text: string, className?: string }) {
  return (
    <h2 className={`text-base font-semibold text-neutral-800 mb-1 mt-2 ${className}`}>{text}</h2>
  )
}
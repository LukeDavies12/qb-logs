export default function H3({ text, className } : { text: string, className?: string }) {
  return (
    <h3 className={`text-sm font-semibold text-neutral-700 ${className}`}>{text}</h3>
  )
}
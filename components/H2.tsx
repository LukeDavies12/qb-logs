export default function H2({ text, className } : { text: string, className?: string }) {
  return (
    <h2 className={`text-base font-semibold text-neutral-800 ${className}`}>{text}</h2>
  )
}
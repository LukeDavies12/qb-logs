export default function H1({ text, className } : { text: string, className?: string }) {
  return (
    <h1 className={`text-lg font-bold text-black mb-3 mt-2 ${className}`}>{text}</h1>
  )
}
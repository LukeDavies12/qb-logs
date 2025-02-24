// Alert.tsx
export default function Alert({ message, type = "error" }: { message: string, type?: "error" | "success" }) {
  const bgColor = type === "error" ? "bg-red-50" : "bg-green-50"
  const textColor = type === "error" ? "text-red-700" : "text-green-700"
  const borderColor = type === "error" ? "border-red-400" : "border-green-400"

  return (
    <div
      className={`${bgColor} ${textColor} ${borderColor} border px-4 py-3 rounded relative mb-4`}
      role="alert">
      {message}
    </div>
  )
}
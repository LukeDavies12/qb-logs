"use client"

import Alert from "@/components/Alert"
import DefaultButton from "@/components/DefaultButton"
import H1 from "@/components/H1"
import TextInput from "@/components/TextInput"
import { useActionState } from "react"
import { loginAction } from "./loginAction"

export default function Page() {
  const [state, action, isPending] = useActionState(loginAction, null)
  const error = state?.error || null
  
  return (
    <div className="lg:w-3/4 lg:mx-auto">
      <H1 text="Login" />
      
      {error && <Alert message={error} type="error" />}
      
      <form action={action} className="p-8 border border-gray-200 rounded-lg">
        <div className="lg:grid lg:grid-cols-2 lg:gap-2 space-y-2 lg:space-y-0">
          <TextInput label="Email" name="email" type="email" placeholder="e.g. coachsmith@briarcliff.edu" required error={error?.includes('email')} defaultValue={state?.inputs?.email} />
          <TextInput label="Password" name="password" type="password" placeholder="------------" required defaultValue={state?.inputs?.password} />
        </div>
        <DefaultButton text={isPending ? "Logging in..." : "Login"} type="submit" className="mt-4 w-full" disabled={isPending} />
      </form>
    </div>
  )
}
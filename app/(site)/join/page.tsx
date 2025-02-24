'use client'

import { useState } from 'react'
import DefaultButton from "@/components/DefaultButton"
import H1 from "@/components/H1"
import TextInput from "@/components/TextInput"
import Alert from "@/components/Alert"
import { joinAction } from './joinAction'

export default function Page() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await joinAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="lg:w-3/4 lg:mx-auto">
      <H1 text="Join QB Logs" />
      
      {error && <Alert message={error} type="error" />}
      
      <form action={handleSubmit} className="p-8 border border-gray-200 rounded-lg">
        <div className="lg:grid lg:grid-cols-4 lg:gap-2">
          <TextInput label="Email" name="email" type="email" placeholder="e.g. coachsmith@briarcliff.edu" required error={error?.includes('email')} />
          <TextInput label="Name" name="display_name" type="text" placeholder="e.g. Coach Smith" required />
          <TextInput label="Job Title" name="job_title" type="text" placeholder="e.g. QB Coach" required />
          <TextInput label="Password" name="password" type="password" placeholder="------------" required />
        </div>
        <br />
        <div className="border-t border-neutral-200"></div>
        <br />
        <div className="lg:grid lg:grid-cols-3 lg:gap-2">
          <TextInput label="Team" name="team_name" type="text" placeholder="e.g. Briar Cliff Chargers" required error={error?.includes('team')} />
          <TextInput label="City" name="team_city" type="text" placeholder="e.g. Sioux City" required />
          <TextInput label="State" name="team_state" type="text" placeholder="e.g. IA" required />
        </div>
        <DefaultButton text={isLoading ? "Creating account..." : "Join"} type="submit" className="mt-4 w-full" disabled={isLoading} />
      </form>
    </div>
  )
}
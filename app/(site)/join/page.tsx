'use client'

import { useActionState } from 'react'
import DefaultButton from "@/components/DefaultButton"
import H1 from "@/components/H1"
import TextInput from "@/components/TextInput"
import Alert from "@/components/Alert"
import { joinAction } from './joinAction'

export default function Page() {
  const [state, action, isPending] = useActionState(joinAction, null)
  const error = state?.error || null

  return (
    <div className="lg:w-3/4 lg:mx-auto">
      <H1 text="Join QB Logs" />
      
      {error && <Alert message={error} type="error" />}
      
      <form action={action} className="p-8 border border-gray-200 rounded-lg">
        <div className="lg:grid lg:grid-cols-4 lg:gap-2">
          <TextInput label="Email" name="email" type="email" placeholder="e.g. coachsmith@briarcliff.edu" required error={error?.includes('email')} defaultValue={state?.inputs?.email}/>
          <TextInput label="Name" name="display_name" type="text" placeholder="e.g. Coach Smith" required defaultValue={state?.inputs?.display_name} />
          <TextInput label="Job Title" name="job_title" type="text" placeholder="e.g. QB Coach" required defaultValue={state?.inputs?.job_title} />
          <TextInput label="Password" name="password" type="password" placeholder="------------" required defaultValue={state?.inputs?.password} />
        </div>
        <br />
        <div className="border-t border-neutral-200"></div>
        <br />
        <div className="lg:grid lg:grid-cols-3 lg:gap-2">
          <TextInput label="Team" name="team_name" type="text" placeholder="e.g. Briar Cliff Chargers" required error={error?.includes('team')} defaultValue={state?.inputs?.team_name} />
          <TextInput label="City" name="team_city" type="text" placeholder="e.g. Sioux City" required defaultValue={state?.inputs?.team_city} />
          <TextInput label="State" name="team_state" type="text" placeholder="e.g. IA" required error={error?.includes('State')} defaultValue={state?.inputs?.team_state} />
        </div>
        <DefaultButton 
          text={isPending ? "Creating account..." : "Join"} 
          type="submit" 
          className="mt-4 w-full" 
          disabled={isPending} 
        />
      </form>
    </div>
  )
}
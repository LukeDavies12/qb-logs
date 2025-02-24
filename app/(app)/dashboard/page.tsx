import { getCurrentSession } from "@/auth/auth";
import H1 from "@/components/H1";

export default async function Page() {
  const user = await getCurrentSession()
  return (
    <>
      <H1 text={`Welcome, {user.user?.display_name}`} />
    </>
  )
}
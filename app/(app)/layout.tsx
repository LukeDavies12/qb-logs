import { getCurrentSession } from "@/auth/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getCurrentSession()
  if (!user) redirect("/")

  return (
    <div className="px-3 lg:px-4 flex">
      <div className="bg-neutral-950 text-white w-[40px} h-screen px-2 fixed top-0 left-0 z-10">
        <div className="mt-auto mb-3">
          <LogoutButton />
        </div>
      </div>
      <div className="pb-24 pt-3">
        {children}
      </div>
    </div>
  );
}

import { getCurrentSession } from "@/auth/auth";
import { LogoutButton } from "@/components/LogoutButton";
import LogoWhite from "@/components/LogoWhite";
import { ChartArea, HomeIcon, Settings2 } from "lucide-react";
import Link from "next/link";
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
        <div className="mb-3 mt-auto py-3 h-full flex flex-col justify-between items-center">
          <div className="flex flex-col gap-8">
            <Link href={"/dashboard"}><LogoWhite /></Link>
            <div className="flex flex-col gap-3">
              <Link href={"/dashboard"} className="p-2 bg-neutral-900 hover:bg-neutral-800 rounded-sm"><HomeIcon className="w-5" /></Link>
              <Link href={"/all-plays"} className="p-2 bg-neutral-900 hover:bg-neutral-800 rounded-sm"><ChartArea className="w-5" /></Link>
              {user.role === "Admin" && <Link href={"/settings"} className="p-2 bg-neutral-900 hover:bg-neutral-800 rounded-sm"><Settings2 className="w-5" /></Link>}
            </div>
          </div>
          <div>
            <LogoutButton />
          </div>
        </div>
      </div>
      <div className="pb-24 ml-[40px] px-3">
        {children}
      </div>
    </div>
  );
}

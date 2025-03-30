import { getCurrentSession } from "@/auth/auth";
import { LogoutButton } from "@/components/LogoutButton";
import LogoWhite from "@/components/LogoWhite";
import { Tooltip } from "@/components/Tooltip";
import { HomeIcon, Settings2, User2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getCurrentSession();
  if (!user) redirect("/");

  return (
    <div className="flex flex-col">
      <div className="bg-neutral-950 text-white py-1 w-full flex items-center px-4">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <Link href={"/dashboard"} className="flex items-center">
              <LogoWhite />
            </Link>
            <div className="flex items-center gap-3">
              <Tooltip text="Dashboard" position="bottom">
                <Link
                  href={"/dashboard"}
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 rounded-md flex justify-center items-center w-[38px] h-[38px]"
                >
                  <HomeIcon className="h-4" />
                </Link>
              </Tooltip>
              {user.role === "Admin" && (
                <Tooltip text="Manage Team" position="bottom">
                  <Link
                    href={"/manage-team"}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 rounded-md flex justify-center items-center w-[38px] h-[38px]"
                  >
                    <Settings2 className="h-4" />
                  </Link>
                </Tooltip>
              )}
              <Tooltip text="User Settings" position="bottom">
                <Link
                  href={"/user-settings"}
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 rounded-md flex justify-center items-center w-[38px] h-[38px]"
                >
                  <User2 className="h-4" />
                </Link>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-50 select-none cursor-default">{user.display_name}</div>
            <Tooltip text="Logout" position="bottom">
              <div>
                <LogoutButton />
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
      <div className="w-full px-4">
        {children}
      </div>
    </div>
  );
}
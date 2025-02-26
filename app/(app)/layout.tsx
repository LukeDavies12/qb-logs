import { getCurrentSession } from "@/auth/auth";
import { LogoutButton } from "@/components/LogoutButton";
import LogoWhite from "@/components/LogoWhite";
import { Tooltip } from "@/components/Tooltip"; // Import the Tooltip component
import { ChartArea, HomeIcon, Settings2 } from "lucide-react";
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
    <div className="px-3 lg:px-4 flex">
      {/* Fixed width sidebar with proper centering */}
      <div className="bg-neutral-950 text-white w-[54px] h-screen fixed top-0 left-0 z-10 flex justify-center">
        <div className="py-3 h-full flex flex-col justify-between items-center w-full">
          <div className="flex flex-col gap-8 items-center w-full">
            {/* Logo at the top */}
            <Link href={"/dashboard"} className="flex justify-center">
              <LogoWhite />
            </Link>

            {/* Navigation icons */}
            <div className="flex flex-col gap-3 items-center w-full">
              <Tooltip text="Dashboard" position="right">
                <Link
                  href={"/dashboard"}
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 rounded-sm flex justify-center items-center w-[38px] h-[38px]"
                >
                  <HomeIcon className="w-5" />
                </Link>
              </Tooltip>

              <Tooltip text="All Plays" position="right">
                <Link
                  href={"/all-plays"}
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 rounded-sm flex justify-center items-center w-[38px] h-[38px]"
                >
                  <ChartArea className="w-5" />
                </Link>
              </Tooltip>

              {user.role === "Admin" && (
                <Tooltip text="Manage Team" position="right">
                  <Link
                    href={"/settings"}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 rounded-sm flex justify-center items-center w-[38px] h-[38px]"
                  >
                    <Settings2 className="w-5" />
                  </Link>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Logout button at the bottom */}
          <div className="flex justify-center w-full">
            <Tooltip text="Logout" position="right">
              <div className="flex justify-center w-full">
                <LogoutButton />
              </div>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Main content area with correct left margin */}
      <div className="pb-24 ml-[40px] px-3 w-full">
        {children}
      </div>
    </div>
  );
}
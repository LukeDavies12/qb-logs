import { getCurrentSession } from "@/auth/auth";
import Logo from "@/components/Logo";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getCurrentSession();
  if (!user) return (
    <div className="px-3 lg:px-16 pb-24">
      <nav className="my-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center font-bold text-base gap-1 text-black"><Logo /> QB Logs</Link>
        </div>
      </nav>
      {children}
    </div>
  );

  if (user.email.length > 1) redirect("/dashboard");
}

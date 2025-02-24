import Logo from "@/components/Logo";
import Link from "next/link";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="px-3 lg:px-16 pb-24">
      <nav className="my-3">
        <Link href="/" className="flex items-center font-bold text-base gap-1"><Logo/> QB Logs</Link>
      </nav>
      {children}
    </div>
  );
}

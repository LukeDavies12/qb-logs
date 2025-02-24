import Link from "next/link";

export default function Home() {
  return (
    <div className="mt-24 lg:w-3/4 lg:mx-auto">
      <h1 className="text-4xl lg:text-6xl font-bold text-black">The OC + QB Coach OS</h1>
      <div className="flex gap-5 items-center mt-8">
        <Link href="/join" className="inline-flex items-center px-4 py-2 w-[200px] border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">Join QB Logs</Link>
        <Link href="/login" className="inline-flex items-center px-4 py-2 w-[200px] border border-transparent text-base font-medium rounded-md shadow-sm text-neutral-700 bg-neutral-100 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">Login</Link>
      </div>
    </div>
  );
}

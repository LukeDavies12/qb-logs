import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <>
      <div className="mx-auto mt-8 text-lg lg:w-3/4">
        <div>
          <div>
            <h1 className="font-bold text-2xl lg:text-5xl text-black">Segment your playbook. Grade what matters. View across practices and games.</h1>
            <p className="mt-4 text-lg lg:text-xl">Track progressions, ball placement, RPO reads, pocket presence,
              and audibles—automatically surfacing the right fields based on play type.</p>
          </div>
          <div className="flex items-center gap-8 mt-8">
            <Link href={"/join"}>
              <button className="bg-blue-600 text-white py-3 px-4 text-lg font-semibold text-left w-72 border-2 border-blue-600 hover:bg-blue-800 hover:border-blue-800 transition-all ease-linear duration-150">
                Join QB Logs
              </button>
            </Link>
            <Link href={"/login"}>
              <button className="bg-transparent text-black py-3 px-4 text-lg font-semibold text-left w-72 border-2 border-neutral-300 hover:bg-neutral-300 transition-all ease-linear duration-150">
                Login
              </button>
            </Link>
          </div>
        </div>
        <div className="w-full mt-12">
          <Image
            src="/qbly.jpg"
            alt="QB Logs Demo Image: Segement your playbook and grade your quarterbacks in depth. "
            width={800}
            height={600}
            quality={100}
            className="w-full h-auto shadow-lg object-cover"
            priority
          />
        </div>
      </div>
    </>
  )
}

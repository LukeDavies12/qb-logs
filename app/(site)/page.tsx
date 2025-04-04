import { ArrowRight, SquareCheckBigIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <div className="pb-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
        <div className="lg:w-1/3 lg:order-1">
          <div className="space-y-3">
            <div>
            </div>
            <ul className="space-y-6">
              <li className="flex gap-3 items-start border-l-2 border-neutral-400 pl-3">
                <SquareCheckBigIcon className="h-5 w-5 text-neutral-700 flex-shrink-0 mt-1" />
                <p className="text-sm sm:text-base">
                  Segment your playbook. Grade what matters. Track progressions, ball placement, RPO reads, pocket
                  presence, and audibles—automatically surfacing the right fields based on play type.
                </p>
              </li>
              <li className="flex gap-3 items-start border-l-2 border-neutral-400 pl-3">
                <SquareCheckBigIcon className="h-5 w-5 text-neutral-700 flex-shrink-0 mt-1" />
                <div className="text-sm sm:text-base">
                  <p className="font-medium">If you notice a trend, get data to back it up:</p>
                  <p className="mt-1">"He's struggling with pressure."</p>
                  <p className="mt-1">
                    Under pressure: <span className="font-bold text-neutral-800">4/11</span> on progression reads.
                  </p>
                  <p className="mt-1 italic text-neutral-600">
                    Next step? Script similar looks in practice. Measure improvement.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 items-start border-l-2 border-neutral-400 pl-3">
                <SquareCheckBigIcon className="h-5 w-5 text-neutral-700 flex-shrink-0 mt-1" />
                <div className="text-sm sm:text-base">
                  <p>Create play tags for situational filtering:</p>
                  <div className="mt-1 pl-2 border-l border-neutral-300 mb-2">
                    <p className="mb-1">
                      <span className="text-neutral-800 rounded-s-md p-1 bg-neutral-100">#Deep Ball Attempt</span> Surprisingly 72%
                      completion, 28-yard avg, just 1 turnover in 3 games.
                    </p>
                    <p>
                      <span className="text-neutral-800 rounded-s-md p-1 bg-neutral-100">#RPO Missed</span> Show yardage and conversion impact compared to other run plays.
                    </p>
                  </div>
                </div>
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/join"
                className="inline-flex items-center justify-center px-8 py-1.5 border border-transparent text-base rounded-md font-semibold text-white bg-neutral-800 hover:bg-neutral-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
              >
                Join QB Logs
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-1.5 border border-neutral-800 text-base font-semibold rounded-md text-neutral-800 bg-white hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
        <div className="lg:w-2/3 mt-4 lg:mt-0 mb-6 lg:mb-0 lg:order-2">
          <div className="rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/qbly.jpg"
              alt="QB Logs software demonstration"
              width={1600}
              height={1000}
              quality={100}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}

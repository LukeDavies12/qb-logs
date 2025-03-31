import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mt-24 lg:w-3/5 lg:mx-auto">
      <h1 className="text-4xl lg:text-6xl font-bold text-black">The OC + QB Coach OS</h1>
      <p className="text-xl lg:text-2xl text-neutral-800 mt-2">Gain a new level of understanding in your QB room. <span className="font-bold">Analyze the decisions, execution, and trends that define success and turn potential into production.</span></p>
      <Image
        src={"https://file.notion.so/f/f/069fff3d-5357-4dae-a23c-11db72936e9e/3268c200-4a7b-4ec1-bae7-4f00a8e2b1be/qbly.jpg?table=block&id=1c632f7b-74dd-8014-89d5-f1f756e00b01&spaceId=069fff3d-5357-4dae-a23c-11db72936e9e&expirationTimestamp=1743465600000&signature=CQEDpbzm4q3TT3TqHG6D78pSJLDRTH5w6tvqbavdfkQ&downloadName=qbly.jpg"}
        alt="QB Logs Software Demo"
        fill={true}
      />
      <div className="flex gap-5 items-center mt-12">
        <Link href="/join" className="inline-flex items-center px-4 py-2 w-[200px] border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">Join QB Logs</Link>
        <Link href="/login" className="inline-flex items-center px-4 py-2 w-[200px] border border-transparent text-base font-medium rounded-md shadow-sm text-neutral-700 bg-neutral-100 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">Login</Link>
      </div>
    </div>
  );
}

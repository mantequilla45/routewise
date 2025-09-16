"use client"
import Image from "next/image";
import RoadAnimation from "./RoadAnimation";

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-white min-h-screen">
      <header>

      </header>
      <main className="max-w-7xl w-full px-16 mx-auto bg-[#404040] h-screen flex items-center justify-center overflow-hidden relative">
        <RoadAnimation />
        <div className="flex w-full flex-col mb-16">
          <p className="text-6xl font-bold mb-10">
            Welcome to
          </p>
          <Image
            src="/logo.svg"
            alt="Logo"
            width={700}
            height={1000}
            className="z-20 border-[1px] border-[#404040] mb-6"
          />
          
          <p className="flex flex-row text-lg">
            Download App on <span className="flex flex-row gap-4 justify-around mx-4">
              <Image src="/icons/googleplay.svg" alt="Google Play" width={25} height={25} />
              <Image src="/icons/applestore.svg" alt="Google Play" width={25} height={25} />
              <Image src="/icons/web.svg" alt="Google Play" width={25} height={25} />
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
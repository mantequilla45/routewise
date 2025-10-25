import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pb-12 gap-8">
      <main className="border-2 p-5 rounded-xl -20 flex flex-col gap-[15px] row-start-2 items-center sm:items-center">
        <div className="flex flex-col items-center sm:items-center">
          <p className="p-2">
            Welcome to
          </p>
          <Image
            src="/routewise.svg"
            alt="Routewise logo"
            width={180}
            height={38}
            priority
          />
          <p className="pt-5">
            Log in using an admin account
          </p>
        </div>
        
        <form className="flex flex-col w-90 mb-5">
          <p>
            Email:
          </p>
          <input 
            type="email"
            required
            // placeholder="email"
            className="mt-1 p-2 border rounded-md border-gray-400 w-full max-w-sm">
          </input>

          <p className="mt-4">
            Password:
          </p>
          <input 
            type="password"
            required
            // placeholder="password"
            className="mt-1 p-2 border rounded-md border-gray-400 w-full max-w-sm">
          </input>

          <button 
            type="submit"
            className="flex flex-col mt-6 p-3 border rounded-md border-gray-700 w-full max-w-sm font-bold hover:bg-gray-700 cursor-pointer"
            >
              Log In
          </button>
        </form>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-col items-center justify-center">
        <div
          className="gap-2 w-95 sm:text-center"
        >
          By signing up, you agree to the
          <span className="font-bold"> Terms of Service </span>
          and
          <span className="font-bold"> Data Processing Agreement</span>
        </div>
      </footer>
    </div>
  );
}

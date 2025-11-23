"use client";

import Image from "next/image";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/component";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const isValid = e.target.checkValidity();
    setEmailError(!isValid);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(false);
    if (generalError) setGeneralError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (generalError) setGeneralError(null);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error(error);
      alert("Invalid email or password");
      return;
    }
    router.push("/dashboard ");
  };

  // Define conditional classes for the email input border
  const emailInputClasses = `opacity-75 p-2 border-2 rounded-lg w-full max-w-xs outline-none transition duration-150 
    ${
      emailError
        ? "border-red-500 text-red-600"
        : "border-gray-400 focus:border-gray-500"
    }`;

  // Define standard classes for other inputs
  const standardInputClasses = `opacity-50 p-2 border-2 rounded-lg w-full max-w-xs outline-none transition duration-150 border-gray-400 focus:border-gray-500`;

  return (
    <div className="flex items-center justify-center font-[lexend] h-screen gap-10 bg-[#FFFFFF]">
      <Image
        src="/roadbg.svg"
        alt="Road Background"
        width={1920}
        height={713}
        priority
      />
      <div className="absolute flex w-[1030px] items-center justify-between h-[430px]">
        <main className="w-[590px]">
          <p className="font-bold text-white text-[29px] font-sans mt-[10px] mb-[125px]">
            Welcome to
            <Image
              src="/routewise.svg"
              alt="Routewise Logo"
              width={417}
              height={90}
              priority
            />
          </p>

          <p className="text-[31px]">Find the Best Jeepney Route in Seconds</p>
          <p className="text-[23px]">
            RouteWise shows your best jeepney route, total fare, and transfer
            points — automatically.
          </p>
        </main>

        <main className="bg-[#3A3A3A] p-8 rounded-xl shadow-2xl h-[405px] w-[339px] flex items-center justify-center">
          <div className="h-[350px]">
            <div className="text-white flex flex-col items-center justify-center">
              <p className="text-[33px]">Welcome Admin!</p>
              <p className="text-[12px]">
                Log in using an admin account to proceed
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="text-white flex flex-col w-full items-center gap-3 pt-5"
            >
              {generalError && (
                <div className="text-sm text-center text-red-600 p-2 bg-red-100 rounded-md w-full max-w-xs">
                  {generalError}
                </div>
              )}

              <div className="flex flex-col w-full max-w-xs text-[13px]">
                <label htmlFor="email-input" className="font-medium">
                  Email:
                </label>
                <input
                  id="email-input"
                  name="email-input"
                  type="email"
                  required
                  placeholder="admin@route.com"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  className={emailInputClasses}
                />
                {emailError && (
                  <div className="text-xs text-red-500 mt-1">
                    Please enter a valid email address.
                  </div>
                )}
              </div>

              <div className="flex flex-col w-full max-w-xs text-[13px]">
                <label htmlFor="password-input" className="font-medium">
                  Password:
                </label>
                <input
                  id="password-input"
                  name="password-input"
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={standardInputClasses}
                />
              </div>

              <button
                type="submit"
                className="mt-2 mb-5 rounded-lg bg-[#4C4C4C] text-white font-bold shadow-md transition-all duration-200 
            hover:bg-[#404040] hover:shadow-sm focus:outline-none shadow-sm shadow-[#FFCC66]
            h-[43px] w-full max-w-xs text-[13px]"
              >
                Log In
              </button>
            </form>

            <footer className="text-[10px] flex items-center justify-center p-2">
              <div className="text-gray-400 text-center max-w-md">
                By signing up, you agree to the
                <span className="text-black font-bold text-gray-100">
                  {" "}
                  Terms of Service{" "}
                </span>
                and
                <span className="text-black font-bold text-gray-100">
                  {" "}
                  Data Processing Agreement
                </span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

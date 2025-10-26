"use client";

import Image from "next/image";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const isValid = e.target.checkValidity();
    setEmailError(!isValid);
  };

  // Clears the email error state as soon as the user starts typing again.
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Remove error state and general error when the user interacts
    if (emailError) setEmailError(false);
    if (generalError) setGeneralError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (generalError) setGeneralError(null);
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    
    // --- MOCK AUTHENTICATION LOGIC ---
    const isLoginSuccessful = (email === 'admin@route.com' && password === 'secure');

    if (isLoginSuccessful) {
      router.push('/dashboard'); 
    } else {
      setGeneralError('Invalid admin email or password.');
    }
  };

  // Define conditional classes for the email input border
  const emailInputClasses = `opacity-50 mt-1 p-3 border-2 rounded-lg w-full max-w-xs outline-none transition duration-150 
    ${emailError ? 'border-red-500 text-red-600' : 'border-gray-400 focus:border-gray-500'}`;
  
  // Define standard classes for other inputs
  const standardInputClasses = `opacity-50 mt-1 p-3 border-2 rounded-lg w-full max-w-xs outline-none transition duration-150 border-gray-400 focus:border-gray-500`;


  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pb-14 gap-10 bg-[#404040]">
      <main className="bg-[#303030] p-5 rounded-xl shadow-2xl flex flex-col gap-4 row-start-2 items-center w-full max-w-sm">
        
        <div className="text-white flex flex-col items-center gap-2">
          <p className="text-lg">
            Welcome to
          </p>
          <Image
            src="/routewise.svg"
            alt="Routewise logo"
            width={180}
            height={38} 
            priority
          />
          <p className="pt-3 text-sm">
            Log in using an admin account
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="text-white flex flex-col w-full items-center gap-4">
            {generalError && (
                <div className="text-sm text-center text-red-600 p-2 bg-red-100 rounded-md w-full max-w-xs">
                    {generalError}
                </div>
            )}
            
            <div className="flex flex-col w-full max-w-xs">
                <label htmlFor="email-input" className="text-sm font-medium">Email:</label>
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

            <div className="flex flex-col w-full max-w-xs">
                <label htmlFor="password-input" className="text-sm font-medium">Password:</label>
                <input 
                  id="password-input"
                  name="password-input"
                  type="password"
                  required
                  placeholder="secure"
                  value={password}
                  onChange={handlePasswordChange}
                  className={standardInputClasses}
                />
            </div>

            <button
                type="submit"
                className="mt-4 rounded-lg bg-[#4c4c4c] text-white font-bold shadow-md transition-all duration-200 
                           hover:bg-[#404040] hover:shadow-sm focus:outline-none shadow-sm shadow-[#ffcc66]
                           h-12 px-8 w-full max-w-xs"
            >
                Log In
            </button>
        </form>
      </main>

      <footer className="row-start-3 flex flex-col items-center justify-center p-4">
        <div className="text-xs text-gray-500 text-center max-w-md">
          By signing up, you agree to the
          <span className="text-black font-bold text-gray-700"> Terms of Service </span>
          and
          <span className="text-black font-bold text-gray-700"> Data Processing Agreement</span>
        </div>
      </footer>
    </div>
  );
}

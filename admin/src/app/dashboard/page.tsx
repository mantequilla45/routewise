"use client";

import React from 'react';
// We'll use this mock for consistency in the single-file environment, 
// though a real dashboard might not need it unless it has client-side navigation.
// import { useRouter } from 'next/navigation'; 

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      
      <main className="bg-white p-10 rounded-xl shadow-2xl border-t-4 border-green-500 text-center w-full max-w-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, Admin!</h1>
        <p className="text-gray-600 text-lg mb-6">
          You have successfully logged in to the secure Routewise dashboard.
        </p>
        
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-700 border border-gray-200">
            This is where your routing tasks and key information will appear.
        </div>
      </main>

      <footer className="mt-8 text-sm text-gray-500">
        Dashboard loaded successfully.
      </footer>
    </div>
  );
}
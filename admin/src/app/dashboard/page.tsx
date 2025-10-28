"use client";

import React from 'react';

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#404040]">

      <main className="bg-[#303030] p-10 rounded-xl shadow-2xl text-center w-full max-w-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome, Admin!</h1>
        <p className="text-white text-lg mb-6">
          You have successfully logged in to the Routewise admin dashboard.
        </p>

        <div className="mt-8 p-4 bg-[#404040] rounded-lg text-sm text-white border border-gray-200">
          This is where your routing tasks and key information will appear.
        </div>
      </main>

      <footer className="mt-8 text-sm text-gray-500">
        Dashboard loaded successfully.
      </footer>
    </div>
  );
}
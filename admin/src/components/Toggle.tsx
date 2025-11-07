"use client";

import { useState } from "react";

// Assume you pass the fetched table content as a prop
interface ToggleProps {
  userTable: React.ReactNode;
}

export default function Toggle({ userTable }: ToggleProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div>
      {/* 1. The Toggle Button */}
      <button
        onClick={() => setShowTable(!showTable)}
        className={`
        flex items-center gap-4 rounded-xl bg-[#4c4c4c] text-white transition-all duration-200 
        hover:bg-[#404040] 
        h-12 px-8 w-60 justify-center max-w-xs m-5 p-5
        
        /* 🛑 FIX: Conditionally apply shadow classes */
        ${showTable ? "shadow-sm shadow-[#ffcc66]" : "shadow-none"} 
        
        /* Apply a slight scale on press for tactile feel, but don't toggle the shadow here */
        active:scale-95 
    `}
      >
        {/* Toggle the text based on the state */}
        {showTable ? "User Management" : "User Management"}
      </button>

      {/* 2. The Conditional Table Display */}
      {showTable && <div>{userTable}</div>}
    </div>
  );
}

"use client";

import { useState } from "react";

interface ToggleProps {
  userTable: React.ReactNode;
  tripHistoryTable: React.ReactNode;
  savedRoutesTable: React.ReactNode;
  newJeepneyRoutesTable: React.ReactNode;
  jeepneyRoutesTable: React.ReactNode;
}

export default function Toggle({
  userTable,
  tripHistoryTable,
  savedRoutesTable,
  newJeepneyRoutesTable,
  jeepneyRoutesTable,
}: ToggleProps) {
  const [showTable, setShowTable] = useState(false);
  const [showTripHistoryTable, setShowTripHistoryTable] = useState(false);
  const [showSavedRoutesTable, setShowSavedRoutesTable] = useState(false);
  const [showNewJeepneyRoutesTable, setShowNewJeepneyRoutesTable] =
    useState(false);
  const [showJeepneyRoutesTable, setShowJeepneyRoutesTable] = useState(false);

  return (
    <div>
      <div className="flex w-full">
        {/* 1. User Management */}
        <button
          onClick={() => setShowTable(!showTable)}
          className={`
        flex items-center gap-4 rounded-xl bg-[#404040] text-white transition-all duration-200 
        hover:bg-[#4c4c4c] 
        h-12 px-8 w-60 justify-center max-w-xs m-5 p-5
        
        /* 🛑 FIX: Conditionally apply shadow classes */
        ${showTable ? "shadow-sm shadow-[#ffcc66]" : "shadow-none"} 
        
        /* Apply a slight scale on press for tactile feel, but don't toggle the shadow here */
        active:scale-95 
        `}
        >
          {"User Management"}
        </button>

        {/* 2. Trip History */}
        <button
          onClick={() => setShowTripHistoryTable(!showTripHistoryTable)}
          className={`
        flex items-center gap-4 rounded-xl bg-[#404040] text-white transition-all duration-200 
        hover:bg-[#4c4c4c] 
        h-12 px-8 w-60 justify-center max-w-xs m-5 p-5
        
        /* 🛑 FIX: Conditionally apply shadow classes */
        ${showTripHistoryTable ? "shadow-sm shadow-[#ffcc66]" : "shadow-none"} 
        
        /* Apply a slight scale on press for tactile feel, but don't toggle the shadow here */
        active:scale-95 
        `}
        >
          {"Trip History"}
        </button>

        {/* 3. Saved Routes */}
        <button
          onClick={() => setShowSavedRoutesTable(!showSavedRoutesTable)}
          className={`
        flex items-center gap-4 rounded-xl bg-[#404040] text-white transition-all duration-200 
        hover:bg-[#4c4c4c] 
        h-12 px-8 w-60 justify-center max-w-xs m-5 p-5
        
        /* 🛑 FIX: Conditionally apply shadow classes */
        ${showSavedRoutesTable ? "shadow-sm shadow-[#ffcc66]" : "shadow-none"} 
        
        /* Apply a slight scale on press for tactile feel, but don't toggle the shadow here */
        active:scale-95 
        `}
        >
          {"Saved Routes"}
        </button>

        {/* 4. New Jeepney Routes */}
        <button
          onClick={() =>
            setShowNewJeepneyRoutesTable(!showNewJeepneyRoutesTable)
          }
          className={`
        flex items-center gap-4 rounded-xl bg-[#404040] text-white transition-all duration-200 
        hover:bg-[#4c4c4c] 
        h-12 px-8 w-60 justify-center max-w-xs m-5 p-5
        
        /* 🛑 FIX: Conditionally apply shadow classes */
        ${
          showNewJeepneyRoutesTable
            ? "shadow-sm shadow-[#ffcc66]"
            : "shadow-none"
        } 
        
        /* Apply a slight scale on press for tactile feel, but don't toggle the shadow here */
        active:scale-95 
        `}
        >
          {"New Jeepney Routes"}
        </button>

        {/* 5. Jeepney Routes */}
        <button
          onClick={() => setShowJeepneyRoutesTable(!showJeepneyRoutesTable)}
          className={`
        flex items-center gap-4 rounded-xl bg-[#404040] text-white transition-all duration-200 
        hover:bg-[#4c4c4c] 
        h-12 px-8 w-60 justify-center max-w-xs m-5 p-5
        
        /* 🛑 FIX: Conditionally apply shadow classes */
        ${
          showJeepneyRoutesTable ? "shadow-sm shadow-[#ffcc66]" : "shadow-none"
        } 
        
        /* Apply a slight scale on press for tactile feel, but don't toggle the shadow here */
        active:scale-95 
        `}
        >
          {"Jeepney Routes"}
        </button>
      </div>

      {/* Conditional Table Display */}
      {showTable && <div>{userTable}</div>}
      {showTripHistoryTable && <div>{tripHistoryTable}</div>}
      {showSavedRoutesTable && <div>{savedRoutesTable}</div>}
      {showNewJeepneyRoutesTable && <div>{newJeepneyRoutesTable}</div>}
      {showJeepneyRoutesTable && <div>{jeepneyRoutesTable}</div>}
    </div>
  );
}

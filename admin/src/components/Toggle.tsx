"use client";

import { useState } from "react";

interface ToggleProps {
  userTable: React.ReactNode;
  tripHistoryTable: React.ReactNode;
  savedRoutesTable: React.ReactNode;
  newJeepneyRoutesTable: React.ReactNode;
  jeepneyRoutesTable: React.ReactNode;

  users: any[];
  trips: any[];
  saved: any[];
  newJ: any[];
  jeepR: any[];
}

type ActiveTableId =
  | "users"
  | "tripHistory"
  | "savedRoutes"
  | "newJeepneyRoutes"
  | "jeepneyRoutes";

export default function Toggle({
  userTable,
  tripHistoryTable,
  savedRoutesTable,
  newJeepneyRoutesTable,
  jeepneyRoutesTable,
  users,
  trips,
  saved,
  newJ,
  jeepR,
}: ToggleProps) {
  // const [showTable, setShowTable] = useState(false);
  // const [showTripHistoryTable, setShowTripHistoryTable] = useState(false);
  // const [showSavedRoutesTable, setShowSavedRoutesTable] = useState(false);
  // const [showNewJeepneyRoutesTable, setShowNewJeepneyRoutesTable] =
  //   useState(false);
  // const [showJeepneyRoutesTable, setShowJeepneyRoutesTable] = useState(false);

  const [activeTable, setActiveTable] = useState<ActiveTableId>("users");

  // Helper function to generate class names
  const getButtonClasses = (id: ActiveTableId) => `
    flex items-center rounded-[20px] bg-[#404040] transition-all duration-200 
    hover:bg-[#4c4c4c] 
    h-[40px] w-[210px] justify-center m-5 p-5 text-[13px]
    ${
      activeTable === id
        ? "bg-[#FFCC66] text-black hover:bg-[#FFCC66]"
        : "shadow-none"
    } 
    active:scale-95 
  `;

  // Helper to determine the message and array for the active table
  const getActiveDataAndMessage = () => {
    switch (activeTable) {
      case "users":
        return { data: users, message: "No users found." };
      case "tripHistory":
        return { data: trips, message: "No trip history found." };
      case "savedRoutes":
        return { data: saved, message: "No saved routes found." };
      case "newJeepneyRoutes":
        return { data: newJ, message: "No new jeepney routes found." };
      case "jeepneyRoutes":
        return { data: jeepR, message: "No jeepney routes found." };
      default:
        return { data: [], message: "Select a category." };
    }
  };

  const { data: activeData, message: noDataMessage } =
    getActiveDataAndMessage();

  return (
    <div>
      <div className="flex w-full">
        <button
          onClick={() => setActiveTable("users")}
          className={getButtonClasses("users")}
        >
          {"User Management"}
        </button>
        <button
          onClick={() => setActiveTable("tripHistory")}
          className={getButtonClasses("tripHistory")}
        >
          {"Trip History"}
        </button>
        <button
          onClick={() => setActiveTable("savedRoutes")}
          className={getButtonClasses("savedRoutes")}
        >
          {"Saved Routes"}
        </button>
        <button
          onClick={() => setActiveTable("newJeepneyRoutes")}
          className={getButtonClasses("newJeepneyRoutes")}
        >
          {"New Jeepney Routes"}
        </button>
        <button
          onClick={() => setActiveTable("jeepneyRoutes")}
          className={getButtonClasses("jeepneyRoutes")}
        >
          {"Jeepney Routes"}
        </button>
      </div>

      {/* Conditional Table Display */}
      {activeTable === "users" && <div>{userTable}</div>}
      {activeTable === "tripHistory" && <div>{tripHistoryTable}</div>}
      {activeTable === "savedRoutes" && <div>{savedRoutesTable}</div>}
      {activeTable === "newJeepneyRoutes" && <div>{newJeepneyRoutesTable}</div>}
      {activeTable === "jeepneyRoutes" && <div>{jeepneyRoutesTable}</div>}

      {/* {showTable && <div>{userTable}</div>}
      {showTripHistoryTable && <div>{tripHistoryTable}</div>}
      {showSavedRoutesTable && <div>{savedRoutesTable}</div>}
      {showNewJeepneyRoutesTable && <div>{newJeepneyRoutesTable}</div>}
      {showJeepneyRoutesTable && <div>{jeepneyRoutesTable}</div>} */}

      {/* 🚀 CONDITIONAL NO-DATA MESSAGE */}
      {activeData.length === 0 && (
        <p className="flex items-center justify-center mt-4 text-gray-400">
          {noDataMessage}
        </p>
      )}
    </div>
  );
}

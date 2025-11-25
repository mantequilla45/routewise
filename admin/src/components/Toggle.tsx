"use client";

import { useState } from "react";

// Import types from dashboard page
interface UserData {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  created_at: string;
  commuter_type: string | null;
}
interface TripHistoryData {
  id: string;
  user_id: string;
  start_location: string;
  end_location: string;
  start_lat: string;
  end_lat: string;
  start_lng: string;
  end_lng: string;
  jeepney_codes: string;
  total_fare: string;
  trip_date: string;
}
interface SavedRoutesData {
  id: string;
  user_id: string;
  route_name: string;
  start_location: string;
  end_location: string;
  start_lat: string;
  end_lat: string;
  start_lng: string;
  end_lng: string;
  jeepney_codes: string;
  total_fare: string;
  created_at: string;
}
interface NewJeepneyRoutesData {
  id: string;
  route_code: string;
  start_point_name: string;
  end_point_name: string;
}
interface JeepneyRoutesData {
  id: string;
  route_code: string;
  name: string;
  city: string | null;
  jeepney_type: string | null;
  length_m: string | null;
}

interface ToggleProps {
  userTable: React.ReactNode;
  tripHistoryTable: React.ReactNode;
  savedRoutesTable: React.ReactNode;
  newJeepneyRoutesTable: React.ReactNode;
  jeepneyRoutesTable: React.ReactNode;

  users: UserData[];
  trips: TripHistoryData[];
  saved: SavedRoutesData[];
  newJ: NewJeepneyRoutesData[];
  jeepR: JeepneyRoutesData[];
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
      <div className="flex w-full items-center justify-center">
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

import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server-client";
import Toggle from "@/components/Toggle";

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
}

async function getUsersData(): Promise<UserData[]> {
  const supabaseAdmin = createAdminClient();

  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("id, full_name, email, phone_number, created_at, commuter_type");
  if (error) {
    console.error("Error fetching data from the users table:", error);
    return [];
  }

  return users as UserData[];
}
async function getTripHistoryData(): Promise<TripHistoryData[]> {
  const supabaseAdmin = createAdminClient();

  const { data: trip, error } = await supabaseAdmin
    .from("trip_history")
    .select("*");
  if (error) {
    console.error("Error fetching data from user trip history:", error);
    return [];
  }

  return trip as TripHistoryData[];
}
async function getSavedRoutesData(): Promise<SavedRoutesData[]> {
  const supabaseAdmin = createAdminClient();

  const { data: savedRoutes, error } = await supabaseAdmin
    .from("saved_routes")
    .select("*");
  if (error) {
    console.error("Error fetching data from user saved routes:", error);
    return [];
  }
  return savedRoutes as SavedRoutesData[];
}
async function getNewJeepneyRoutesData(): Promise<NewJeepneyRoutesData[]> {
  const supabaseAdmin = createAdminClient();

  const { data: newJeepneyRoutes, error } = await supabaseAdmin
    .from("new_jeepney_routes")
    .select("*");
  if (error) {
    console.error("Error fetching new jeepney routes:", error);
    return [];
  }
  return newJeepneyRoutes as NewJeepneyRoutesData[];
}
async function getJeepneyRoutesData(): Promise<JeepneyRoutesData[]> {
  const supabaseAdmin = createAdminClient();

  const { data: jeepneyRoutes, error } = await supabaseAdmin
    .from("jeepney_routes")
    .select("*");
  if (error) {
    console.error("Error fetching jeepney routes:", error);
    return [];
  }
  return jeepneyRoutes as JeepneyRoutesData[];
}

// Component to render the table
function UserTable({ users }: { users: any[] }) {
  return (
    <div
      className="m-5 bg-[#FFCC66] rounded-lg overflow-y-auto"
      style={{ maxHeight: "330px" }}
    >
      <table className="min-w-full text-black table-fixed">
        <thead className="top-0 sticky">
          <tr>
            <th className="py-3 px-6 text-left text-sm font-bold rounded-tl-lg bg-white w-1/5">
              Full Name
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Email
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Status
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Phone Number
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Created At
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold rounded-tr-lg bg-white w-1/5">
              User Type
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-700">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-gray-750 transition duration-150"
            >
              <td className="py-4 px-6 text-sm">{user.full_name || "N/A"}</td>

              <td className="py-4 px-6 text-sm">{user.email || "N/A"}</td>

              <td className="py-4 px-6 text-sm">
                {user.email ? "Active" : "Unknown"}
              </td>

              <td className="py-4 px-6 text-sm">
                {user.phone_number || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {new Date(user.created_at).toLocaleDateString()}
              </td>

              <td className="py-4 px-6 text-sm">
                {user.commuter_type || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function TripHistoryTable({ trips }: { trips: any[] }) {
  return (
    <div
      className="m-5 bg-[#ffcc66] rounded-lg overflow-y-auto"
      style={{ maxHeight: "calc(60vh - 10px)" }}
    >
      <table className="min-w-full text-black table-fixed">
        <thead className="sticky top-0">
          <tr>
            <th className="py-3 px-6 text-left text-sm font-bold rounded-tl-lg bg-white w-1/5">
              Email
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Start Location
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              End Location
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Jeepney Code
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Total Fare
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold rounded-tr-lg bg-white w-1/5">
              Trip Date
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-700">
          {trips.map((trip_history) => (
            <tr
              key={trip_history.id}
              className="hover:bg-gray-750 transition duration-150"
            >
              <td className="py-4 px-6 text-sm">
                {trip_history.user_id || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {trip_history.start_location || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {trip_history.end_location || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {trip_history.jeepney_codes || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {trip_history.total_fare || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {new Date(trip_history.trip_date).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function SavedRoutesTable({ saved }: { saved: any[] }) {
  return (
    <div
      className="m-5 bg-[#ffcc66] rounded-lg overflow-y-auto"
      style={{ maxHeight: "calc(60vh - 10px)" }}
    >
      <table className="min-w-full text-black table-fixed">
        <thead className="sticky top-0">
          <tr>
            <th className="py-3 px-6 text-left text-sm font-bold rounded-tl-lg bg-white w-1/5">
              Email
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Route Name
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Start Location
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              End Location
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Jeepney Code
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold rounded-tr-lg bg-white w-1/5">
              Trip Date
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-700">
          {saved.map((saved_routes) => (
            <tr
              key={saved_routes.id}
              className="hover:bg-gray-750 transition duration-150"
            >
              <td className="py-4 px-6 text-sm">
                {saved_routes.user_id || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {saved_routes.route_name || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {saved_routes.start_location || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {saved_routes.end_location || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {saved_routes.jeepney_codes || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {new Date(saved_routes.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function NewJeepneyRoutesTable({ newJ }: { newJ: any[] }) {
  return (
    <div
      className="m-5 bg-[#ffcc66] rounded-lg overflow-y-auto"
      style={{ maxHeight: "calc(60vh - 10px)" }}
    >
      <table className="min-w-full text-black table-fixed">
        <thead className="sticky top-0">
          <tr>
            <th className="py-3 px-6 text-left text-sm font-bold rounded-tl-lg bg-white w-1/5">
              Route Code
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Start Point
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold rounded-tr-lg bg-white w-1/5">
              End Point
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-700">
          {newJ.map((new_jeepney_routes) => (
            <tr
              key={new_jeepney_routes.id}
              className="hover:bg-gray-750 transition duration-150"
            >
              <td className="py-4 px-6 text-sm">
                {new_jeepney_routes.route_code || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {new_jeepney_routes.start_point_name || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {new_jeepney_routes.end_point_name || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function JeepneyRoutesTable({ jeepR }: { jeepR: any[] }) {
  return (
    <div
      className="m-5 bg-[#ffcc66] rounded-lg overflow-y-auto"
      style={{ maxHeight: "calc(60vh - 10px)" }}
    >
      <table className="min-w-full text-black table-fixed">
        <thead className="sticky top-0">
          <tr>
            <th className="py-3 px-6 text-left text-sm font-bold rounded-tl-lg bg-white w-1/5">
              Route Code
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Name
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              Length
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold bg-white w-1/5">
              City
            </th>
            <th className="py-3 px-6 text-left text-sm font-bold rounded-tr-lg bg-white w-1/5">
              Jeepney Type
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-700">
          {jeepR.map((jeepney_routes) => (
            <tr
              key={jeepney_routes.id}
              className="hover:bg-gray-750 transition duration-150"
            >
              <td className="py-4 px-6 text-sm">
                {jeepney_routes.route_code || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {jeepney_routes.name || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {jeepney_routes.length_m || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {jeepney_routes.city || "N/A"}
              </td>

              <td className="py-4 px-6 text-sm">
                {jeepney_routes.jeepney_type || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function DashboardPage() {
  const users = await getUsersData();
  const trips = await getTripHistoryData();
  const saved = await getSavedRoutesData();
  const newJ = await getNewJeepneyRoutesData();
  const jeepR = await getJeepneyRoutesData();

  return (
    // <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#404040]">

    //   <main className="bg-[#303030] p-10 rounded-xl shadow-2xl text-center w-full max-w-lg">
    //     <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
    //       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    //     </svg>
    //     <h1 className="text-3xl font-bold text-white mb-2">Welcome, Admin!</h1>
    //     <p className="text-white text-lg mb-6">
    //       You have successfully logged in to the Routewise admin dashboard.
    //     </p>

    //     <div className="mt-8 p-4 bg-[#404040] rounded-lg text-sm text-white border border-gray-200">
    //       This is where your routing tasks and key information will appear.
    //     </div>
    //   </main>

    //   <footer className="mt-8 text-sm text-gray-500">
    //     Dashboard loaded successfully.
    //   </footer>
    // </div>

    <div className="p-8 min-h-screen bg-[#2D2D2D] font-[lexend]">
      <h1 className="text-[29px] font-bold font-[lexend] mb-6 text-center">
        Welcome to the Routewise Admin Dashboard
      </h1>

      <main className=" flex justify-center">
        <div className="bg-[#404040] rounded-[20px] h-[450px] w-[1280px] shadow-lg">
          <Toggle
            // We render the table component on the server and pass the result
            userTable={<UserTable users={users} />}
            tripHistoryTable={<TripHistoryTable trips={trips} />}
            savedRoutesTable={<SavedRoutesTable saved={saved} />}
            newJeepneyRoutesTable={<NewJeepneyRoutesTable newJ={newJ} />}
            jeepneyRoutesTable={<JeepneyRoutesTable jeepR={jeepR} />}
            users={users}
            trips={trips}
            saved={saved}
            newJ={newJ}
            jeepR={jeepR}
          />
        </div>
      </main>
    </div>
  );
}

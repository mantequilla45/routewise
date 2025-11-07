import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server-client";
import UserManagementToggle from "@/components/Toggle";

interface UserData {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  created_at: string;
}

async function getUsersData(): Promise<UserData[]> {
  const supabaseAdmin = createAdminClient();

  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("id, full_name, email, phone_number, created_at");

  if (error) {
    console.error("Error fetching data from the users table:", error);
    return [];
  }

  return users as UserData[];
}

// A new component to render the actual table
function UserTable({ users }: { users: any[] }) {
  // 🛑 MOVE ALL YOUR TABLE HTML (<thead>, <tbody>, etc.) HERE

  return (
    <div
      className="m-5 bg-[#ffcc66] rounded-lg overflow-y-auto"
      style={{ maxHeight: "calc(60vh - 10px)" }}
    >
      <table className="min-w-full text-black table-fixed sticky top-0">
        <thead>
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
            <th className="py-3 px-6 text-left text-sm font-bold rounded-tr-lg bg-white w-1/5">
              Created At
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-700 sticky top-0">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function DashboardPage() {
  const users = await getUsersData();

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

    <div className="p-8 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Welcome to the Routewise Admin Dashboard
      </h1>

      <div className="bg-[#404040] rounded-lg h-125">
        <UserManagementToggle
          // We render the table component on the server and pass the result
          userTable={<UserTable users={users} />}
        />
      </div>

      {users.length === 0 && (
        <p className="mt-4 text-gray-400">No users found.</p>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server-client";

// Function to fetch the users from Supabase Auth
async function getUsers() {
  const supabaseAdmin = createAdminClient();

  // This call uses the Service Role Key to fetch ALL users
  const {
    data: { users },
    error,
  } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return users;
}

export default async function DashboardPage() {
  const users = await getUsers();

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

    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-xl">
        <table className="min-w-full text-white">
          <thead className="bg-gray-700">
            <tr>
              <th className="py-3 px-6 text-left text-sm font-medium">ID</th>
              <th className="py-3 px-6 text-left text-sm font-medium">Email</th>
              <th className="py-3 px-6 text-left text-sm font-medium">
                Status
              </th>
              <th className="py-3 px-6 text-left text-sm font-medium">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-750 transition duration-150"
              >
                <td className="py-4 px-6 text-sm">
                  {user.id.substring(0, 8)}...
                </td>
                <td className="py-4 px-6 text-sm">{user.email || "N/A"}</td>
                <td className="py-4 px-6 text-sm">
                  {user.email_confirmed_at ? "Active" : "Unconfirmed"}
                </td>
                <td className="py-4 px-6 text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <p className="mt-4 text-gray-400">No users found.</p>
      )}
    </div>
  );
}

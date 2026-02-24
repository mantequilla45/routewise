"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import EditUserModal from "@/components/users/EditUserModal";

interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  is_admin?: boolean;
  google_id?: string;
  picture?: string;
  last_login?: string;
  login_count?: number;
  auth_provider?: string;
  metadata?: Record<string, unknown>;
  commuter?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");
      
      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      const url = isCreating ? "/api/users" : `/api/users/${selectedUser?.id}`;
      const method = isCreating ? "POST" : "PUT";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error("Failed to save user");
      
      const savedUser = await response.json();
      
      if (isCreating) {
        setUsers([...users, savedUser]);
      } else {
        setUsers(users.map(u => u.id === savedUser.id ? savedUser : u));
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Failed to save user");
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Users Management</h1>
        <p className="text-gray-400">Manage user accounts and permissions</p>
      </div>

      <div className="bg-[#3A3A3A] rounded-xl shadow-lg border border-[#404040]">
        <div className="p-6 border-b border-[#404040]">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#2D2D2D] border border-[#4C4C4C] text-white rounded-lg focus:ring-2 focus:ring-[#FFCC66] focus:border-[#FFCC66] placeholder-gray-500"
              />
            </div>
            <button
              onClick={handleCreate}
              className="ml-4 px-4 py-2 bg-[#FFCC66] text-black font-semibold rounded-lg hover:bg-[#CC9933] transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFCC66]"></div>
            <p className="mt-2 text-gray-400">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2D2D2D]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#FFCC66] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#FFCC66] uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#FFCC66] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#FFCC66] uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#FFCC66] uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#FFCC66] uppercase tracking-wider">
                    Logins
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#FFCC66] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#3A3A3A] divide-y divide-[#404040]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#404040] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {(user.avatar_url || user.picture) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className="h-10 w-10 rounded-full mr-3"
                            src={user.avatar_url || user.picture}
                            alt="User avatar"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-white">
                            {user.full_name || "No name"}
                          </div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {user.phone_number || "-"}
                      </div>
                      {user.commuter && (
                        <div className="text-sm text-gray-400">
                          Commuter: {user.commuter}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_admin
                          ? "bg-[#FFCC66] text-black"
                          : "bg-[#4C4C4C] text-gray-300"
                      }`}>
                        {user.is_admin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.auth_provider === "google"
                          ? "bg-[#CC9933] text-white"
                          : "bg-[#4C4C4C] text-gray-300"
                      }`}>
                        {user.auth_provider || "Email"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(user.last_login || user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {user.login_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-[#FFCC66] hover:text-[#CC9933] mr-3 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-400">No users found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <EditUserModal
          user={selectedUser}
          isCreating={isCreating}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
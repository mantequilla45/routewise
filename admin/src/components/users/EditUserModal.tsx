"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

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
  metadata?: any;
  commuter?: string;
}

interface EditUserModalProps {
  user: User | null;
  isCreating: boolean;
  onClose: () => void;
  onSave: (userData: Partial<User>) => Promise<void>;
}

export default function EditUserModal({
  user,
  isCreating,
  onClose,
  onSave,
}: EditUserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({
    email: "",
    full_name: "",
    phone_number: "",
    is_admin: false,
    commuter: "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        full_name: user.full_name || "",
        phone_number: user.phone_number || "",
        is_admin: user.is_admin || false,
        commuter: user.commuter || "",
        avatar_url: user.avatar_url || "",
      });
    } else {
      setFormData({
        email: "",
        full_name: "",
        phone_number: "",
        is_admin: false,
        commuter: "",
        avatar_url: "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#3A3A3A] rounded-xl shadow-2xl w-full max-w-md p-6 border border-[#404040]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {isCreating ? "Create New User" : "Edit User"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#FFCC66] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#2D2D2D] border border-[#4C4C4C] text-white rounded-lg focus:ring-2 focus:ring-[#FFCC66] focus:border-[#FFCC66] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name || ""}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#2D2D2D] border border-[#4C4C4C] text-white rounded-lg focus:ring-2 focus:ring-[#FFCC66] focus:border-[#FFCC66] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone_number || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#2D2D2D] border border-[#4C4C4C] text-white rounded-lg focus:ring-2 focus:ring-[#FFCC66] focus:border-[#FFCC66] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Commuter Type
            </label>
            <select
              value={formData.commuter || ""}
              onChange={(e) =>
                setFormData({ ...formData, commuter: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#2D2D2D] border border-[#4C4C4C] text-white rounded-lg focus:ring-2 focus:ring-[#FFCC66] focus:border-[#FFCC66] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">None</option>
              <option value="student">Student</option>
              <option value="worker">Worker</option>
              <option value="regular">Regular</option>
              <option value="senior">Senior</option>
              <option value="pwd">PWD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Avatar URL
            </label>
            <input
              type="url"
              value={formData.avatar_url || ""}
              onChange={(e) =>
                setFormData({ ...formData, avatar_url: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#2D2D2D] border border-[#4C4C4C] text-white rounded-lg focus:ring-2 focus:ring-[#FFCC66] focus:border-[#FFCC66] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_admin"
              checked={formData.is_admin || false}
              onChange={(e) =>
                setFormData({ ...formData, is_admin: e.target.checked })
              }
              className="h-4 w-4 text-[#FFCC66] focus:ring-[#FFCC66] border-[#4C4C4C] rounded accent-[#FFCC66]"
            />
            <label
              htmlFor="is_admin"
              className="ml-2 block text-sm text-gray-300"
            >
              Administrator
            </label>
          </div>

          {isCreating && (
            <div className="p-3 bg-[#4C4C4C] rounded-lg border border-[#FFCC66]">
              <p className="text-sm text-[#FFCC66]">
                Note: Password will be set when user first logs in via Google or creates an account.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 bg-[#2D2D2D] rounded-lg hover:bg-[#404040] transition-colors border border-[#4C4C4C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#FFCC66] text-black font-semibold rounded-lg hover:bg-[#CC9933] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const RouteDetailsModal = dynamic(() => import("./RouteDetailsModal"), {
  ssr: false,
});
const EditRouteModal = dynamic(() => import("./EditRouteModal"), {
  ssr: false,
});

interface Route {
  id: string;
  route_code: string;
  start_point_name: string;
  end_point_name: string;
  horizontal_or_vertical_road: boolean;
  updated_at?: string;
  created_at?: string;
}

type SortField = "route_code" | "modified_at";
type SortDirection = "asc" | "desc";

export default function RoutesList({
  onRouteSelect,
}: {
  onRouteSelect?: (route: Route) => void;
}) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("modified_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch("/api/routes/add");
      const data = await response.json();
      if (data.success) {
        setRoutes(data.routes);
      }
    } catch (error) {
      console.error("Failed to fetch routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRoute = async (id: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;

    try {
      const response = await fetch(`/api/routes/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setRoutes(routes.filter((r) => r.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete route:", error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending for code, descending for dates
      setSortField(field);
      setSortDirection(field === "route_code" ? "asc" : "desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M8 9l4-4 4 4m0 6l-4 4-4-4"
          />
        </svg>
      );
    }
    return sortDirection === "asc" ? (
      <svg
        className="w-4 h-4 text-[#FFCC66]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-[#FFCC66]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  const filteredRoutes = routes
    .filter((route) =>
      route.route_code.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortField === "route_code") {
        aValue = a.route_code.toLowerCase();
        bValue = b.route_code.toLowerCase();
      } else {
        // modified_at
        // Use updated_at if available, otherwise created_at
        const aDate = a.updated_at || a.created_at || "";
        const bDate = b.updated_at || b.created_at || "";
        aValue = new Date(aDate).getTime();
        bValue = new Date(bDate).getTime();
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CC9933]"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg gap-3 p-3">
      <div className="flex justify-between items-start p-2">
        <h2 className="text-xl font-bold text-white">
          Existing Routes ({routes.length})
        </h2>
        <input
          type="text"
          placeholder="Search routes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 bg-[#2D2D2D] border border-[#4C4C4C] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFCC66] focus:border-[#FFCC66]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-[#404040] rounded-lg overflow-hidden">
          <thead>
            <tr className="border-b bg-[#2D2D2D] border-[#404040]">
              <th className="text-left p-2 text-[#FFCC66] font-semibold rounded-tl-xl">
                <button
                  onClick={() => handleSort("route_code")}
                  className="flex items-center gap-1 hover:bg-[#404040] px-2 py-1 rounded -ml-2 transition-colors"
                >
                  Code
                  {getSortIcon("route_code")}
                </button>
              </th>
              <th className="text-left p-2 text-[#FFCC66] font-semibold">
                <button
                  onClick={() => handleSort("modified_at")}
                  className="flex items-center gap-1 hover:bg-[#404040] px-2 py-1 rounded -ml-2 transition-colors"
                >
                  Modified At
                  {getSortIcon("modified_at")}
                </button>
              </th>
              <th className="text-left p-2 text-[#FFCC66] font-semibold rounded-tr-xl">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.map((route) => (
              <tr
                key={route.id}
                className="border-b bg-[#3A3A3A] border-[#404040] hover:bg-[#404040] transition-colors"
              >
                <td className="p-2 font-medium text-white">
                  {route.route_code}
                </td>
                <td className="p-2 text-gray-300 text-sm">
                  {route.updated_at ? (
                    <div>
                      <div>
                        {new Date(route.updated_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(route.updated_at).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  ) : route.created_at ? (
                    <div>
                      <div>
                        {new Date(route.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(route.created_at).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}{" "}
                        (created)
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => {
                      setSelectedRouteId(route.id);
                      if (onRouteSelect) onRouteSelect(route);
                    }}
                    className="text-[#FFCC66] hover:text-[#CC9933] mr-3 font-medium transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setEditingRouteId(route.id)}
                    className="text-[#CC9933] hover:text-[#FFCC66] mr-3 font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteRoute(route.id)}
                    className="text-red-500 hover:text-red-400 font-medium transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRoutes.length === 0 && (
          <div className="text-center py-8 text-gray-400 font-medium">
            No routes found
          </div>
        )}
      </div>

      {/* Route Details Modal */}
      <RouteDetailsModal
        routeId={selectedRouteId}
        onClose={() => setSelectedRouteId(null)}
      />

      {/* Edit Route Modal */}
      {editingRouteId && (
        <EditRouteModal
          routeId={editingRouteId}
          isOpen={!!editingRouteId}
          onClose={() => setEditingRouteId(null)}
          onUpdate={() => {
            setEditingRouteId(null);
            fetchRoutes(); // Refresh the list after update
          }}
        />
      )}
    </div>
  );
}

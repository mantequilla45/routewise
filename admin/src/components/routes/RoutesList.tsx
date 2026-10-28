'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

const RouteDetailsModal = dynamic(() => import('./RouteDetailsModal'), {
  ssr: false,
});
const EditRouteModal = dynamic(() => import('./EditRouteModal'), {
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

type SortField = 'route_code' | 'modified_at';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export default function RoutesList({ onRouteSelect }: { onRouteSelect?: (route: Route) => void }) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('modified_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Reset to page 1 whenever filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection]);

  const fetchRoutes = async () => {
    try {
      const data = await api.routes.list<Route>();
      if (data.success) {
        setRoutes(data.routes);
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRoute = async (id: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      await api.routes.remove(id);
      setRoutes(routes.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Failed to delete route:', error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'route_code' ? 'asc' : 'desc');
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
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-[#FFCC66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-[#FFCC66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const filteredRoutes = routes
    .filter((route) => route.route_code.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortField === 'route_code') {
        aValue = a.route_code.toLowerCase();
        bValue = b.route_code.toLowerCase();
      } else {
        const aDate = a.updated_at || a.created_at || '';
        const bDate = b.updated_at || b.created_at || '';
        aValue = new Date(aDate).getTime();
        bValue = new Date(bDate).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / ITEMS_PER_PAGE));
  const clampedPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedPage - 1) * ITEMS_PER_PAGE;
  const paginatedRoutes = filteredRoutes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getPageRange = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (clampedPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (clampedPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', clampedPage - 1, clampedPage, clampedPage + 1, '...', totalPages];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CC9933]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3 p-3">
      <div className="flex justify-between items-center px-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Existing Routes</h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#2A2A2A] border border-[#333] text-sm text-gray-400 font-medium">
            {routes.length}
          </span>
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#FFCC66] focus:border-[#FFCC66] text-sm w-52"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
        <table className="w-full text-sm border border-[#2A2A2A] rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
              <th className="text-left px-4 py-3 text-[#FFCC66] font-semibold w-36">
                <button
                  onClick={() => handleSort('route_code')}
                  className="flex items-center gap-1 hover:bg-[#2A2A2A] px-2 py-1 rounded -ml-2 transition-colors"
                >
                  Route Code
                  {getSortIcon('route_code')}
                </button>
              </th>
              <th className="text-left px-4 py-3 text-[#FFCC66] font-semibold w-40">
                <button
                  onClick={() => handleSort('modified_at')}
                  className="flex items-center gap-1 hover:bg-[#2A2A2A] px-2 py-1 rounded -ml-2 transition-colors"
                >
                  Modified At
                  {getSortIcon('modified_at')}
                </button>
              </th>
              <th className="text-right px-4 py-3 text-[#FFCC66] font-semibold w-36">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]">
            {paginatedRoutes.map((route) => (
              <tr
                key={route.id}
                className="bg-[#111111] hover:bg-[#1A1A1A] transition-colors group"
              >
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-[#333] text-white font-mono font-semibold text-sm">
                    {route.route_code}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {route.updated_at ? (
                    <div>
                      <div className="text-gray-300">
                        {new Date(route.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(route.updated_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ) : route.created_at ? (
                    <div>
                      <div className="text-gray-300">
                        {new Date(route.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(route.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        <span className="text-gray-600">(created)</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setSelectedRouteId(route.id);
                        if (onRouteSelect) onRouteSelect(route);
                      }}
                      className="px-2.5 py-1.5 text-xs rounded-lg text-[#FFCC66] hover:bg-[#2A2500] border border-transparent hover:border-[#FFCC66]/30 font-medium transition-all"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setEditingRouteId(route.id)}
                      className="px-2.5 py-1.5 text-xs rounded-lg text-gray-300 hover:bg-[#2A2A2A] border border-transparent hover:border-[#333] font-medium transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRoute(route.id)}
                      className="px-2.5 py-1.5 text-xs rounded-lg text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 font-medium transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRoutes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-10 h-10 mx-auto mb-3 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <p className="font-medium">No routes found</p>
            {searchTerm && <p className="text-sm mt-1">Try a different search term</p>}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredRoutes.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between px-2 pt-4">
          {/* Showing X–Y of Z */}
          <p className="text-sm text-gray-400">
            Showing <span className="text-white font-medium">{startIndex + 1}</span>
            {' – '}
            <span className="text-white font-medium">
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredRoutes.length)}
            </span>{' '}
            of <span className="text-white font-medium">{filteredRoutes.length}</span> routes
          </p>

          {/* Page controls */}
          <div className="flex items-center gap-1">
            {/* Previous */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={clampedPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#2A2A2A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Page numbers */}
            {getPageRange().map((page, i) =>
              page === '...' ? (
                <span
                  key={`ellipsis-${i}`}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 text-sm"
                >
                  …
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    clampedPage === page
                      ? 'bg-gradient-to-b from-[#FFCC66] to-[#CC9933] text-black shadow-sm'
                      : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ),
            )}

            {/* Next */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={clampedPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#2A2A2A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Route Details Modal */}
      <RouteDetailsModal routeId={selectedRouteId} onClose={() => setSelectedRouteId(null)} />

      {/* Edit Route Modal */}
      {editingRouteId && (
        <EditRouteModal
          routeId={editingRouteId}
          isOpen={!!editingRouteId}
          onClose={() => setEditingRouteId(null)}
          onUpdate={() => {
            setEditingRouteId(null);
            fetchRoutes();
          }}
        />
      )}
    </div>
  );
}

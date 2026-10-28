'use client';

import type { Route, SortDirection, SortField } from '@/hooks/useRoutesTable';

interface RoutesTableProps {
  routes: Route[];
  hasAnyMatches: boolean;
  searchTerm: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onView: (route: Route) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) {
  if (sortField !== field) {
    return (
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
}

function ModifiedAtCell({ route }: { route: Route }) {
  if (route.updated_at) {
    return (
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
    );
  }
  if (route.created_at) {
    return (
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
    );
  }
  return <span className="text-gray-600">—</span>;
}

/** Sortable routes table for the current page, with an empty state when nothing matches. */
export default function RoutesTable({
  routes,
  hasAnyMatches,
  searchTerm,
  sortField,
  sortDirection,
  onSort,
  onView,
  onEdit,
  onDelete,
}: RoutesTableProps) {
  const headerButtonClass =
    'flex items-center gap-1 hover:bg-[#2A2A2A] px-2 py-1 rounded -ml-2 transition-colors';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
      <table className="w-full text-sm border border-[#2A2A2A] rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
            <th className="text-left px-4 py-3 text-[#FFCC66] font-semibold w-36">
              <button onClick={() => onSort('route_code')} className={headerButtonClass}>
                Route Code
                <SortIcon field="route_code" sortField={sortField} sortDirection={sortDirection} />
              </button>
            </th>
            <th className="text-left px-4 py-3 text-[#FFCC66] font-semibold w-40">
              <button onClick={() => onSort('modified_at')} className={headerButtonClass}>
                Modified At
                <SortIcon field="modified_at" sortField={sortField} sortDirection={sortDirection} />
              </button>
            </th>
            <th className="text-right px-4 py-3 text-[#FFCC66] font-semibold w-36">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2A2A2A]">
          {routes.map((route) => (
            <tr key={route.id} className="bg-[#111111] hover:bg-[#1A1A1A] transition-colors group">
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-[#333] text-white font-mono font-semibold text-sm">
                  {route.route_code}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                <ModifiedAtCell route={route} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(route)}
                    className="px-2.5 py-1.5 text-xs rounded-lg text-[#FFCC66] hover:bg-[#2A2500] border border-transparent hover:border-[#FFCC66]/30 font-medium transition-all"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(route.id)}
                    className="px-2.5 py-1.5 text-xs rounded-lg text-gray-300 hover:bg-[#2A2A2A] border border-transparent hover:border-[#333] font-medium transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(route.id)}
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

      {!hasAnyMatches && (
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
  );
}

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ITEMS_PER_PAGE, useRoutesTable } from '@/hooks/useRoutesTable';
import type { Route } from '@/hooks/useRoutesTable';
import RoutesToolbar from './list/RoutesToolbar';
import RoutesTable from './list/RoutesTable';
import Pagination from './list/Pagination';

const RouteDetailsModal = dynamic(() => import('./RouteDetailsModal'), {
  ssr: false,
});
const EditRouteModal = dynamic(() => import('./EditRouteModal'), {
  ssr: false,
});

export default function RoutesList({ onRouteSelect }: { onRouteSelect?: (route: Route) => void }) {
  const table = useRoutesTable();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

  if (table.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CC9933]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3 p-3">
      <RoutesToolbar
        totalCount={table.routes.length}
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
      />

      <RoutesTable
        routes={table.paginatedRoutes}
        hasAnyMatches={table.filteredRoutes.length > 0}
        searchTerm={table.searchTerm}
        sortField={table.sortField}
        sortDirection={table.sortDirection}
        onSort={table.handleSort}
        onView={(route) => {
          setSelectedRouteId(route.id);
          if (onRouteSelect) onRouteSelect(route);
        }}
        onEdit={setEditingRouteId}
        onDelete={table.deleteRoute}
      />

      {/* Pagination */}
      {table.filteredRoutes.length > ITEMS_PER_PAGE && (
        <Pagination
          startIndex={table.startIndex}
          pageSize={ITEMS_PER_PAGE}
          totalItems={table.filteredRoutes.length}
          totalPages={table.totalPages}
          currentPage={table.clampedPage}
          pageRange={table.getPageRange()}
          onPageChange={table.setCurrentPage}
          onPrevious={table.goToPreviousPage}
          onNext={table.goToNextPage}
        />
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
            table.fetchRoutes();
          }}
        />
      )}
    </div>
  );
}

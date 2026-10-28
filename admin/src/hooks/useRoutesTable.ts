'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface Route {
  id: string;
  route_code: string;
  start_point_name: string;
  end_point_name: string;
  horizontal_or_vertical_road: boolean;
  updated_at?: string;
  created_at?: string;
}

export type SortField = 'route_code' | 'modified_at';
export type SortDirection = 'asc' | 'desc';
export type PageItem = number | '...';

export const ITEMS_PER_PAGE = 10;

/** Fetching, search, sort, pagination and delete state for the routes table. */
export function useRoutesTable() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('modified_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRoutes = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  // Reset to page 1 whenever filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection]);

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

  const getPageRange = (): PageItem[] => {
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

  const goToPreviousPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return {
    routes,
    loading,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDirection,
    handleSort,
    fetchRoutes,
    deleteRoute,
    filteredRoutes,
    paginatedRoutes,
    totalPages,
    clampedPage,
    startIndex,
    getPageRange,
    setCurrentPage,
    goToPreviousPage,
    goToNextPage,
  };
}

export type RoutesTable = ReturnType<typeof useRoutesTable>;

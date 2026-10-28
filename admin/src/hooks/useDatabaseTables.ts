'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export interface TableData {
  columns: ColumnInfo[];
  rowCount: number;
  data: Record<string, unknown>[];
  columnCount: number;
  error?: string;
}

export interface DatabaseInfo {
  tables: string[];
  tableData: Record<string, TableData>;
}

export type DatabaseViewMode = 'table' | 'raw' | 'schema';

function downloadJson(payload: unknown, fileName: string) {
  const dataStr = JSON.stringify(payload, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', fileName);
  linkElement.click();
}

function todayStamp() {
  return new Date().toISOString().split('T')[0];
}

export function useDatabaseTables() {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [viewMode, setViewMode] = useState<DatabaseViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDatabaseInfo = useCallback(async () => {
    try {
      const data = await api.database.tables<DatabaseInfo>();

      if (data.success) {
        setDatabaseInfo(data);
        if (data.tables.length > 0) {
          setSelectedTable(data.tables[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch database info:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatabaseInfo();
  }, [fetchDatabaseInfo]);

  const exportTableData = (tableName: string) => {
    if (!databaseInfo) return;

    const tableData = databaseInfo.tableData[tableName];
    downloadJson(tableData.data, `${tableName}_backup_${todayStamp()}.json`);
  };

  const exportAllData = () => {
    if (!databaseInfo) return;

    const allData: Record<string, Record<string, unknown>[]> = {};
    for (const table of databaseInfo.tables) {
      allData[table] = databaseInfo.tableData[table].data;
    }

    downloadJson(allData, `database_backup_${todayStamp()}.json`);
  };

  const currentTableData =
    databaseInfo && selectedTable ? databaseInfo.tableData[selectedTable] : null;
  const filteredData =
    currentTableData?.data.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const tableValues = databaseInfo ? Object.values(databaseInfo.tableData) : [];
  const totalTables = databaseInfo ? databaseInfo.tables.length : 0;
  const totalRows = tableValues.reduce((sum, table) => sum + table.rowCount, 0);
  const totalColumns = tableValues.reduce((sum, table) => sum + table.columnCount, 0);

  return {
    databaseInfo,
    loading,
    selectedTable,
    setSelectedTable,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    fetchDatabaseInfo,
    exportTableData,
    exportAllData,
    currentTableData,
    filteredData,
    totalTables,
    totalRows,
    totalColumns,
  };
}

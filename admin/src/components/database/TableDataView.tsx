'use client';

import type { DatabaseViewMode, TableData } from '@/hooks/useDatabaseTables';
import SchemaTable from '@/components/database/SchemaTable';
import DataTable from '@/components/database/DataTable';

interface TableDataViewProps {
  tableData: TableData;
  viewMode: DatabaseViewMode;
  filteredData: Record<string, unknown>[];
  searchTerm: string;
}

export default function TableDataView({
  tableData,
  viewMode,
  filteredData,
  searchTerm,
}: TableDataViewProps) {
  return (
    <div className="bg-[#3A3A3A] rounded-xl border border-[#404040]">
      {tableData.error ? (
        <div className="p-6 text-center text-red-400">Error loading table: {tableData.error}</div>
      ) : viewMode === 'schema' ? (
        <SchemaTable columns={tableData.columns} />
      ) : viewMode === 'raw' ? (
        <div className="bg-[#2D2D2D] border border-[#4C4C4C] p-6 overflow-x-auto max-h-[600px] rounded-lg">
          <pre className="text-[#FFCC66] text-xs font-mono">
            {JSON.stringify(filteredData, null, 2)}
          </pre>
        </div>
      ) : (
        <DataTable columns={tableData.columns} rows={filteredData} searchTerm={searchTerm} />
      )}
    </div>
  );
}

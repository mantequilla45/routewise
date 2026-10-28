'use client';

import { useDatabaseTables } from '@/hooks/useDatabaseTables';
import DatabaseHeader from '@/components/database/DatabaseHeader';
import DatabaseStats from '@/components/database/DatabaseStats';
import TableList from '@/components/database/TableList';
import TableControls from '@/components/database/TableControls';
import TableDataView from '@/components/database/TableDataView';

export default function DatabasePage() {
  const {
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
  } = useDatabaseTables();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CC9933] mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading database...</p>
        </div>
      </div>
    );
  }

  if (!databaseInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load database information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DatabaseHeader onExportAll={exportAllData} onRefresh={fetchDatabaseInfo} />

      <DatabaseStats totalTables={totalTables} totalRows={totalRows} totalColumns={totalColumns} />

      <div className="flex space-x-6">
        <TableList
          tables={databaseInfo.tables}
          tableData={databaseInfo.tableData}
          selectedTable={selectedTable}
          onSelect={setSelectedTable}
        />

        <div className="flex-1 w-[200px]">
          <TableControls
            selectedTable={selectedTable}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onExport={() => exportTableData(selectedTable)}
          />

          {currentTableData && (
            <TableDataView
              tableData={currentTableData}
              viewMode={viewMode}
              filteredData={filteredData}
              searchTerm={searchTerm}
            />
          )}
        </div>
      </div>
    </div>
  );
}

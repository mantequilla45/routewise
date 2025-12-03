"use client";

import { useState, useEffect } from "react";

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableData {
  columns: ColumnInfo[];
  rowCount: number;
  data: Record<string, unknown>[];
  columnCount: number;
  error?: string;
}

interface DatabaseInfo {
  tables: string[];
  tableData: Record<string, TableData>;
}

export default function DatabasePage() {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "raw" | "schema">("table");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const fetchDatabaseInfo = async () => {
    try {
      const response = await fetch("/api/database/tables");
      const data = await response.json();

      if (data.success) {
        setDatabaseInfo(data);
        if (data.tables.length > 0) {
          setSelectedTable(data.tables[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch database info:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportTableData = (tableName: string) => {
    if (!databaseInfo) return;

    const tableData = databaseInfo.tableData[tableName];
    const dataStr = JSON.stringify(tableData.data, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${tableName}_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const exportAllData = () => {
    if (!databaseInfo) return;

    const allData: Record<string, Record<string, unknown>[]> = {};
    for (const table of databaseInfo.tables) {
      allData[table] = databaseInfo.tableData[table].data;
    }

    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `database_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

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

  const currentTableData = selectedTable
    ? databaseInfo.tableData[selectedTable]
    : null;
  const filteredData =
    currentTableData?.data.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Calculate total stats
  const totalTables = databaseInfo.tables.length;
  const totalRows = Object.values(databaseInfo.tableData).reduce(
    (sum, table) => sum + table.rowCount,
    0
  );
  const totalColumns = Object.values(databaseInfo.tableData).reduce(
    (sum, table) => sum + table.columnCount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Database Management</h1>
          <p className="text-white mt-1">
            Complete database overview and management
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportAllData}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Export All</span>
          </button>
          <button
            onClick={fetchDatabaseInfo}
            className="px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Database Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#3A3A3A] rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Total Tables</p>
              <p className="text-2xl font-bold text-white mt-1">
                {totalTables}
              </p>
            </div>
            <div className="p-3 bg-[#CC9933] rounded-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Rows</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalRows.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Columns</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalColumns}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Database</p>
              <p className="text-sm font-semibold text-green-600 mt-1">
                PostgreSQL + PostGIS
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex space-x-6">
        {/* Left Sidebar - Table List */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Tables</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {databaseInfo.tables.map((table) => {
                const tableData = databaseInfo.tableData[table];
                const isSelected = selectedTable === table;
                return (
                  <button
                    key={table}
                    onClick={() => setSelectedTable(table)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all hover:bg-blue-50 ${
                      isSelected
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            isSelected ? "text-blue-700" : "text-gray-900"
                          }`}
                        >
                          {table}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {tableData.rowCount} rows • {tableData.columnCount}{" "}
                          cols
                        </p>
                      </div>
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </div>
                    {tableData.error && (
                      <p className="text-xs text-red-500 mt-1">Error loading</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Content - Table Data */}
        <div className="flex-1 bg-[#CC9933] w-[200px]">
          {/* Controls Bar */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="font-semibold text-gray-900">{selectedTable}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      viewMode === "table"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode("schema")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      viewMode === "schema"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Schema
                  </button>
                  <button
                    onClick={() => setViewMode("raw")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      viewMode === "raw"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Search in table..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => exportTableData(selectedTable)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Export this table"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Data Display */}
          {currentTableData && (
            <div className="bg-white rounded-xl border border-gray-100">
              {currentTableData.error ? (
                <div className="p-6 text-center text-red-600">
                  Error loading table: {currentTableData.error}
                </div>
              ) : viewMode === "schema" ? (
                <div className="overflow-x-auto">
                  <div className="p-6">
                    <table className="divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Column Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nullable
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Default
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentTableData.columns.map((column) => (
                          <tr
                            key={column.column_name}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {column.column_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <code className="bg-gray-100 px-2 py-1 rounded">
                                {column.data_type}
                              </code>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {column.is_nullable === "YES" ? (
                                <span className="text-green-600">✓ Yes</span>
                              ) : (
                                <span className="text-red-600">✗ No</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {column.column_default ? (
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {column.column_default}
                                </code>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : viewMode === "raw" ? (
                <div className="bg-gray-900 p-6 overflow-x-auto max-h-[600px]">
                  <pre className="text-green-400 text-xs font-mono">
                    {JSON.stringify(filteredData, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="p-6 overflow-x-auto max-h-[600px]">
                  {filteredData.length > 0 ? (
                    <table className="divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {currentTableData.columns.map((column) => (
                            <th
                              key={column.column_name}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {column.column_name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.slice(0, 100).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            {currentTableData.columns.map((column) => (
                              <td
                                key={column.column_name}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {row[column.column_name] !== null ? (
                                  typeof row[column.column_name] ===
                                  "object" ? (
                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                      {JSON.stringify(
                                        row[column.column_name]
                                      ).slice(0, 50)}
                                      ...
                                    </code>
                                  ) : (
                                    <span
                                      className="max-w-xs truncate block"
                                      title={String(row[column.column_name])}
                                    >
                                      {String(row[column.column_name])}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-gray-400 italic">
                                    null
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        {searchTerm
                          ? "No matching data found"
                          : "No data in this table"}
                      </p>
                    </div>
                  )}
                  {filteredData.length > 100 && (
                    <div className="px-6 py-3 bg-gray-50 text-center text-sm text-gray-500 border-t">
                      Showing first 100 rows of {filteredData.length} total
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

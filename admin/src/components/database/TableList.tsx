'use client';

import type { TableData } from '@/hooks/useDatabaseTables';

interface TableListProps {
  tables: string[];
  tableData: Record<string, TableData>;
  selectedTable: string;
  onSelect: (table: string) => void;
}

export default function TableList({ tables, tableData, selectedTable, onSelect }: TableListProps) {
  return (
    <div className="w-64 flex-shrink-0">
      <div className="flex items-start justify-start mb-2">
        <h3 className="font-semibold text-[#FFCC66]">TABLES</h3>
      </div>
      <div className="overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          {tables.map((table) => {
            const data = tableData[table];
            const isSelected = selectedTable === table;
            return (
              <button
                key={table}
                onClick={() => onSelect(table)}
                className={`w-full text-left px-4 py-3 transition-all hover:bg-[#3A3A3A] ${
                  isSelected
                    ? 'bg-[#3A3A3A] border-l-4 border-l-[#CC9933] rounded-md'
                    : 'border-b-2 border-[#3A3A3A] rounded-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}
                    >
                      {table}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {data.rowCount} rows • {data.columnCount} cols
                    </p>
                  </div>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-[#CC9933]"
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
                {data.error && <p className="text-xs text-red-500 mt-1">Error loading</p>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

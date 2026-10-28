'use client';

import type { ColumnInfo } from '@/hooks/useDatabaseTables';

interface DataTableProps {
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  searchTerm: string;
}

function CellValue({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="text-gray-400 italic">null</span>;
  }
  if (typeof value === 'object') {
    return (
      <code className="bg-[#2D2D2D] border border-[#4C4C4C] px-2 py-1 rounded text-xs text-[#FFCC66]">
        {JSON.stringify(value).slice(0, 50)}
        ...
      </code>
    );
  }
  return (
    <span className="max-w-xs truncate block" title={String(value)}>
      {String(value)}
    </span>
  );
}

export default function DataTable({ columns, rows, searchTerm }: DataTableProps) {
  return (
    <div className="p-6 overflow-auto max-h-[600px]">
      {rows.length > 0 ? (
        <table className="divide-y divide-gray-200">
          <thead className="bg-[#2D2D2D] sticky top-0">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.column_name}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  {column.column_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#3A3A3A] divide-y divide-[#404040]">
            {rows.slice(0, 100).map((row, idx) => (
              <tr key={idx} className="hover:bg-[#404040] transition-colors">
                {columns.map((column) => (
                  <td
                    key={column.column_name}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                  >
                    <CellValue value={row[column.column_name]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {searchTerm ? 'No matching data found' : 'No data in this table'}
          </p>
        </div>
      )}
      {rows.length > 100 && (
        <div className="px-6 py-3 bg-[#2D2D2D] text-center text-sm text-gray-400 border-t border-[#404040]">
          Showing first 100 rows of {rows.length} total
        </div>
      )}
    </div>
  );
}

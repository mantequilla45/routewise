'use client';

import type { ColumnInfo } from '@/hooks/useDatabaseTables';

interface SchemaTableProps {
  columns: ColumnInfo[];
}

const HEADER_CLASS =
  'px-6 py-3 text-left text-xs font-medium text-[#FFCC66] uppercase tracking-wider';

export default function SchemaTable({ columns }: SchemaTableProps) {
  return (
    <div className="p-6 overflow-auto max-h-[600px]">
      <table className="divide-y divide-gray-200">
        <thead className="bg-[#2D2D2D] sticky top-0">
          <tr>
            <th className={HEADER_CLASS}>Column Name</th>
            <th className={HEADER_CLASS}>Data Type</th>
            <th className={HEADER_CLASS}>Nullable</th>
            <th className={HEADER_CLASS}>Default</th>
          </tr>
        </thead>
        <tbody className="bg-[#3A3A3A] divide-y divide-[#404040]">
          {columns.map((column) => (
            <tr key={column.column_name} className="hover:bg-[#404040] transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-white">{column.column_name}</td>
              <td className="px-6 py-4 text-sm text-gray-300">
                <code className="bg-[#2D2D2D] border border-[#4C4C4C] px-2 py-1 rounded text-[#FFCC66]">
                  {column.data_type}
                </code>
              </td>
              <td className="px-6 py-4 text-sm text-gray-300">
                {column.is_nullable === 'YES' ? (
                  <span className="text-green-400">✓ Yes</span>
                ) : (
                  <span className="text-red-400">✗ No</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-300">
                {column.column_default ? (
                  <code className="bg-[#2D2D2D] border border-[#4C4C4C] px-2 py-1 rounded text-xs text-[#FFCC66]">
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
  );
}

'use client';

import type { PageItem } from '@/hooks/useRoutesTable';

interface PaginationProps {
  startIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageRange: PageItem[];
  onPageChange: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

/** "Showing X–Y of Z" summary plus previous / numbered / next page controls. */
export default function Pagination({
  startIndex,
  pageSize,
  totalItems,
  totalPages,
  currentPage,
  pageRange,
  onPageChange,
  onPrevious,
  onNext,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-2 pt-4">
      {/* Showing X–Y of Z */}
      <p className="text-sm text-gray-400">
        Showing <span className="text-white font-medium">{startIndex + 1}</span>
        {' – '}
        <span className="text-white font-medium">
          {Math.min(startIndex + pageSize, totalItems)}
        </span>{' '}
        of <span className="text-white font-medium">{totalItems}</span> routes
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#2A2A2A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Page numbers */}
        {pageRange.map((page, i) =>
          page === '...' ? (
            <span
              key={`ellipsis-${i}`}
              className="w-8 h-8 flex items-center justify-center text-gray-500 text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                currentPage === page
                  ? 'bg-gradient-to-b from-[#FFCC66] to-[#CC9933] text-black shadow-sm'
                  : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'
              }`}
            >
              {page}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#2A2A2A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

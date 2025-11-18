
import React from 'react';

interface PaginationProps {
  currentPage: number;
  maxPage: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, maxPage, onPrev, onNext, onJump }) => {
    if (maxPage <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <button
        onClick={onPrev}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <span className="text-sm text-gray-700">
        Page {currentPage} of {maxPage}
      </span>
      <button
        onClick={onNext}
        disabled={currentPage === maxPage}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;

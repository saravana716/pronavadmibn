
import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage: number;
}

export function usePagination<T>({ data, itemsPerPage }: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const maxPage = Math.ceil(data.length / itemsPerPage);

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, itemsPerPage]);

  function next() {
    setCurrentPage((page) => Math.min(page + 1, maxPage));
  }

  function prev() {
    setCurrentPage((page) => Math.max(page - 1, 1));
  }

  function jump(page: number) {
    const pageNumber = Math.max(1, page);
    setCurrentPage(Math.min(pageNumber, maxPage));
  }
  
  // Reset to first page when data changes
  useState(() => {
    if (currentPage > maxPage) {
        setCurrentPage(1);
    }
  });

  return { next, prev, jump, currentData, currentPage, maxPage };
}

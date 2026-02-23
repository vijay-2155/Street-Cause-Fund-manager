"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 rounded-b-xl">
      <div className="flex flex-1 items-center justify-between">
        <div>
          <p className="text-sm text-gray-700 font-medium">
            Showing <span className="font-bold text-gray-900">{startItem}</span> to{" "}
            <span className="font-bold text-gray-900">{endItem}</span> of{" "}
            <span className="font-bold text-gray-900">{totalItems}</span> results
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* First Page */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="h-9 w-9 border-gray-300 disabled:opacity-50"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-9 w-9 border-gray-300 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((page, idx) => (
              <Button
                key={idx}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => typeof page === "number" && onPageChange(page)}
                disabled={page === "..."}
                className={
                  page === currentPage
                    ? "h-9 min-w-9 bg-[#0066FF] text-white hover:bg-[#0052CC]"
                    : "h-9 min-w-9 border-gray-300 hover:bg-gray-50"
                }
              >
                {page}
              </Button>
            ))}
          </div>

          {/* Mobile: Current page indicator */}
          <div className="sm:hidden px-3 py-1 bg-gray-100 rounded-lg">
            <span className="text-sm font-semibold text-gray-900">
              {currentPage} / {totalPages}
            </span>
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-9 w-9 border-gray-300 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-9 w-9 border-gray-300 disabled:opacity-50"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

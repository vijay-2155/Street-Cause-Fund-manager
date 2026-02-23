"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, SlidersHorizontal, Download, User, Sheet, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface ExpenseFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  submitterFilter: string;
  onSubmitterFilterChange: (value: string) => void;
  submitters: string[];
  onClearFilters: () => void;
  onExport: () => void;
  onSheetsExport?: () => void;
  sheetsExporting?: boolean;
  hasActiveFilters: boolean;
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "food", label: "Food" },
  { value: "supplies", label: "Supplies" },
  { value: "transport", label: "Transport" },
  { value: "venue", label: "Venue" },
  { value: "printing", label: "Printing" },
  { value: "medical", label: "Medical" },
  { value: "donation_forward", label: "Donation Forward" },
  { value: "other", label: "Other" },
];

const statuses = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function ExpenseFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  submitterFilter,
  onSubmitterFilterChange,
  submitters,
  onClearFilters,
  onExport,
  onSheetsExport,
  sheetsExporting,
  hasActiveFilters,
}: ExpenseFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    statusFilter !== "all",
    categoryFilter !== "all",
    submitterFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
      {/* ─── Row 1: Search + Toggle + Actions (always visible) ─── */}
      <div className="p-3 sm:p-4 flex items-center gap-2">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search expense..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-11 border-2 border-gray-200 focus:border-[#8B5CF6] rounded-xl text-sm"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-11 px-3 border-2 rounded-xl shrink-0 gap-1.5 font-semibold text-xs transition-all ${
            showFilters || activeFilterCount > 0
              ? "border-[#8B5CF6] bg-[#F5F3FF] text-[#8B5CF6]"
              : "border-gray-200"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#8B5CF6] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>

        {/* Clear */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="h-11 w-11 shrink-0 border-2 border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 rounded-xl"
            title="Clear filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Export buttons */}
        {onSheetsExport && (
          <Button
            onClick={onSheetsExport}
            disabled={sheetsExporting}
            className="h-11 w-11 shrink-0 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl shadow-sm"
            title="Google Sheets"
          >
            {sheetsExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sheet className="h-4 w-4" />}
          </Button>
        )}
        <Button
          onClick={onExport}
          className="h-11 shrink-0 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-semibold shadow-sm px-3 sm:px-4 gap-1.5"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Export</span>
        </Button>
      </div>

      {/* ─── Collapsible Filter Panel ─── */}
      {showFilters && (
        <div className="border-t-2 border-gray-100 p-3 sm:p-4 space-y-3 bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {/* Status */}
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="h-10 border-2 border-gray-200 focus:border-[#8B5CF6] rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category */}
            <Select value={categoryFilter} onValueChange={onCategoryChange}>
              <SelectTrigger className="h-10 border-2 border-gray-200 focus:border-[#8B5CF6] rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Submitter */}
            {submitters.length > 0 && (
              <Select value={submitterFilter} onValueChange={onSubmitterFilterChange}>
                <SelectTrigger className={`h-10 border-2 rounded-xl text-xs font-semibold transition-colors col-span-2 sm:col-span-1 ${
                  submitterFilter !== "all"
                    ? "border-[#8B5CF6] bg-[#F5F3FF] text-[#8B5CF6]"
                    : "border-gray-200 focus:border-[#8B5CF6]"
                }`}>
                  <User className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                  <SelectValue placeholder="Submitter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Submitters</SelectItem>
                  {submitters.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-200">
              {submitterFilter !== "all" && (
                <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#F5F3FF] px-2 py-1 rounded-full flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {submitterFilter}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

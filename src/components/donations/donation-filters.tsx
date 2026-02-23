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
import { Search, X, SlidersHorizontal, Download, Calendar, CalendarDays, Droplets, User, Sheet, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface DonationFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  paymentModeFilter: string;
  onPaymentModeChange: (value: string) => void;
  eventFilter: string;
  onEventFilterChange: (value: string) => void;
  events: any[];
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  bloodGroupFilter: string;
  onBloodGroupFilterChange: (value: string) => void;
  coordinatorFilter: string;
  onCoordinatorFilterChange: (value: string) => void;
  coordinators: string[];
  onClearFilters: () => void;
  onExport: () => void;
  onSheetsExport?: () => void;
  sheetsExporting?: boolean;
  hasActiveFilters: boolean;
}

const paymentModes = [
  { value: "all", label: "All Payment Modes" },
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

const dateFilters = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

const bloodGroups = [
  { value: "all", label: "All Blood Groups" },
  { value: "A+", label: "A+" },
  { value: "A-", label: "A−" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B−" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB−" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O−" },
  { value: "donors_only", label: "Blood Donors Only" },
];

export function DonationFilters({
  searchQuery,
  onSearchChange,
  paymentModeFilter,
  onPaymentModeChange,
  eventFilter,
  onEventFilterChange,
  events,
  dateFilter,
  onDateFilterChange,
  dateRange,
  onDateRangeChange,
  bloodGroupFilter,
  onBloodGroupFilterChange,
  coordinatorFilter,
  onCoordinatorFilterChange,
  coordinators,
  onClearFilters,
  onExport,
  onSheetsExport,
  sheetsExporting,
  hasActiveFilters,
}: DonationFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Count active non-search filters
  const activeFilterCount = [
    paymentModeFilter !== "all",
    eventFilter !== "all",
    dateFilter !== "all",
    bloodGroupFilter !== "all",
    coordinatorFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
      {/* ─── Row 1: Search + Toggle + Actions (always visible) ─── */}
      <div className="p-3 sm:p-4 flex items-center gap-2">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search donor..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-11 border-2 border-gray-200 focus:border-[#10B981] rounded-xl text-sm"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-11 px-3 border-2 rounded-xl shrink-0 gap-1.5 font-semibold text-xs transition-all ${
            showFilters || activeFilterCount > 0
              ? "border-[#10B981] bg-[#D1FAE5] text-[#10B981]"
              : "border-gray-200"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#10B981] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
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
          className="h-11 shrink-0 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-semibold shadow-sm px-3 sm:px-4 gap-1.5"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Export</span>
        </Button>
      </div>

      {/* ─── Collapsible Filter Panel ─── */}
      {showFilters && (
        <div className="border-t-2 border-gray-100 p-3 sm:p-4 space-y-3 bg-gray-50/50">
          {/* Filter Row 1: Date + Event + Payment */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <Select value={dateFilter} onValueChange={onDateFilterChange}>
              <SelectTrigger className="h-10 border-2 border-gray-200 focus:border-[#10B981] rounded-xl text-xs font-semibold">
                <Calendar className="h-3.5 w-3.5 mr-1.5 shrink-0 text-gray-400" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                {dateFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>{filter.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={eventFilter} onValueChange={onEventFilterChange}>
              <SelectTrigger className="h-10 border-2 border-gray-200 focus:border-[#10B981] rounded-xl text-xs font-semibold">
                <CalendarDays className="h-3.5 w-3.5 mr-1.5 shrink-0 text-gray-400" />
                <SelectValue placeholder="Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="general">General Fund</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.name}>{event.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentModeFilter} onValueChange={onPaymentModeChange}>
              <SelectTrigger className="h-10 border-2 border-gray-200 focus:border-[#10B981] rounded-xl text-xs font-semibold col-span-2 sm:col-span-1">
                <SelectValue placeholder="Payment Mode" />
              </SelectTrigger>
              <SelectContent>
                {paymentModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Row 2: Blood Group + Coordinator */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Select value={bloodGroupFilter} onValueChange={onBloodGroupFilterChange}>
              <SelectTrigger className={`h-10 border-2 rounded-xl text-xs font-semibold transition-colors ${
                bloodGroupFilter !== "all"
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-gray-200 focus:border-[#10B981]"
              }`}>
                <Droplets className="h-3.5 w-3.5 mr-1.5 text-red-400 shrink-0" />
                <SelectValue placeholder="Blood Group" />
              </SelectTrigger>
              <SelectContent>
                {bloodGroups.map((bg) => (
                  <SelectItem key={bg.value} value={bg.value}>{bg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {coordinators.length > 0 && (
              <Select value={coordinatorFilter} onValueChange={onCoordinatorFilterChange}>
                <SelectTrigger className={`h-10 border-2 rounded-xl text-xs font-semibold transition-colors ${
                  coordinatorFilter !== "all"
                    ? "border-[#10B981] bg-[#D1FAE5] text-[#10B981]"
                    : "border-gray-200 focus:border-[#10B981]"
                }`}>
                  <User className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                  <SelectValue placeholder="Coordinator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coordinators</SelectItem>
                  {coordinators.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Custom Date Range */}
          {dateFilter === "custom" && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-gray-200">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">From</label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
                  className="h-10 border-2 border-gray-200 focus:border-[#10B981] rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">To</label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
                  className="h-10 border-2 border-gray-200 focus:border-[#10B981] rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-200">
              {bloodGroupFilter !== "all" && (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center gap-1">
                  <Droplets className="h-3 w-3" />
                  {bloodGroupFilter === "donors_only" ? "Donors only" : bloodGroupFilter}
                </span>
              )}
              {coordinatorFilter !== "all" && (
                <span className="text-[10px] font-bold text-[#10B981] bg-[#D1FAE5] px-2 py-1 rounded-full flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {coordinatorFilter}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

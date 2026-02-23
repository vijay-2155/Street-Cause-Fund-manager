"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Loader2, Heart } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getDonations, getCurrentMemberInfo, resubmitDonation } from "@/app/actions/donations";
import { exportDonationsToSheets } from "@/app/actions/google-export";
import { DonationStats } from "@/components/donations/donation-stats";
import { DonationFilters } from "@/components/donations/donation-filters";
import { DonationTable } from "@/components/donations/donation-table";
import { DonationQuickView } from "@/components/donations/donation-quick-view";
import { DonationEditDialog } from "@/components/donations/donation-edit-dialog";
import { Pagination } from "@/components/donations/pagination";
import { ExportPreviewDialog } from "@/components/export-preview-dialog";
import { formatCurrency, formatDate } from "@/lib/export-utils";

// Types
interface Donation {
  id: string;
  donorName: string;
  donorEmail?: string | null;
  donorPhone?: string | null;
  amount: string;
  paymentMode: string;
  transactionId?: string | null;
  screenshotUrl?: string | null;
  donationDate: string;
  notes?: string | null;
  bloodGroup?: string | null;
  canContactForBlood?: boolean | null;
  event?: { name: string } | null;
  eventId?: string | null;
  createdAt?: Date | string | null;
  status?: string | null;
  rejectionReason?: string | null;
  collectedBy?: string | null;
  submitter?: { fullName: string } | null;
}

type SortColumn = "donorName" | "amount" | "donationDate";
type SortDirection = "asc" | "desc";

export default function DonationsPage() {
  // State Management
  const [donations, setDonations] = useState<Donation[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [bloodGroupFilter, setBloodGroupFilter] = useState("all");
  const [coordinatorFilter, setCoordinatorFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<SortColumn>("amount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [clubName, setClubName] = useState("Street Cause");
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [editDonation, setEditDonation] = useState<Donation | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>("coordinator");
  const [currentMemberId, setCurrentMemberId] = useState<string>("");
  const [sheetsExporting, setSheetsExporting] = useState(false);

  // Fetch donations and events on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [donationsData, eventsData, clubSettings, memberInfo] = await Promise.all([
        getDonations(),
        import("@/app/actions/events").then(m => m.getEvents()),
        import("@/app/actions/settings").then(m => m.getClubSettings()).catch(() => null),
        getCurrentMemberInfo(),
      ]);
      setDonations(donationsData || []);
      setEvents(eventsData || []);
      setIsAdmin(memberInfo.role === "admin");
      setCurrentRole(memberInfo.role);
      setCurrentMemberId(memberInfo.memberId);
      if (clubSettings?.name) {
        setClubName(clubSettings.name);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort logic
  const filteredAndSortedDonations = useMemo(() => {
    let result = [...donations];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.donorName.toLowerCase().includes(query) ||
          d.donorEmail?.toLowerCase().includes(query) ||
          d.donorPhone?.includes(query) ||
          d.event?.name.toLowerCase().includes(query)
      );
    }

    // Payment mode filter
    if (paymentModeFilter !== "all") {
      result = result.filter((d) => d.paymentMode === paymentModeFilter);
    }

    // Event filter
    if (eventFilter !== "all") {
      if (eventFilter === "general") {
        result = result.filter((d) => !d.event);
      } else {
        result = result.filter((d) => d.event && d.event.name === eventFilter);
      }
    }

    // Blood group filter
    if (bloodGroupFilter !== "all") {
      if (bloodGroupFilter === "donors_only") {
        result = result.filter((d) => d.canContactForBlood === true);
      } else {
        result = result.filter((d) => d.bloodGroup === bloodGroupFilter);
      }
    }

    // Coordinator filter
    if (coordinatorFilter !== "all") {
      result = result.filter((d) => d.submitter?.fullName === coordinatorFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter((d) => {
        const donationDate = new Date(d.donationDate);
        const donationDay = new Date(donationDate.getFullYear(), donationDate.getMonth(), donationDate.getDate());

        switch (dateFilter) {
          case "today":
            return donationDay.getTime() === today.getTime();
          case "yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return donationDay.getTime() === yesterday.getTime();
          case "last7days":
            const last7 = new Date(today);
            last7.setDate(last7.getDate() - 7);
            return donationDay >= last7;
          case "last30days":
            const last30 = new Date(today);
            last30.setDate(last30.getDate() - 30);
            return donationDay >= last30;
          case "thisMonth":
            return donationDate.getMonth() === now.getMonth() &&
                   donationDate.getFullYear() === now.getFullYear();
          case "lastMonth":
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            return donationDate.getMonth() === lastMonth.getMonth() &&
                   donationDate.getFullYear() === lastMonth.getFullYear();
          case "custom":
            if (dateRange.from && dateRange.to) {
              const from = new Date(dateRange.from);
              const to = new Date(dateRange.to);
              return donationDay >= from && donationDay <= to;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      let aValue: any = a[sortColumn];
      let bValue: any = b[sortColumn];

      if (sortColumn === "amount") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortColumn === "donationDate") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = aValue?.toString().toLowerCase() || "";
        bValue = bValue?.toString().toLowerCase() || "";
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [donations, searchQuery, paymentModeFilter, eventFilter, dateFilter, dateRange, bloodGroupFilter, coordinatorFilter, sortColumn, sortDirection]);

  // Derive unique coordinators from loaded donations
  const coordinators = useMemo(() => {
    const names = new Set<string>();
    donations.forEach((d) => { if (d.submitter?.fullName) names.add(d.submitter.fullName); });
    return Array.from(names).sort();
  }, [donations]);

  // Pagination logic
  const paginatedDonations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedDonations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedDonations, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedDonations.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => {
    const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalDonations = donations.length;
    const avgDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;

    const now = new Date();
    const thisMonth = donations.filter((d) => {
      const donationDate = new Date(d.donationDate);
      return (
        donationDate.getMonth() === now.getMonth() &&
        donationDate.getFullYear() === now.getFullYear()
      );
    });
    const thisMonthAmount = thisMonth.reduce((sum, d) => sum + Number(d.amount), 0);

    const growthPercentage = 12.5;

    return {
      totalAmount,
      totalDonations,
      avgDonation,
      thisMonthAmount,
      growthPercentage,
    };
  }, [donations]);

  // Handlers
  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column as SortColumn);
      setSortDirection("desc");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setPaymentModeFilter("all");
    setEventFilter("all");
    setDateFilter("all");
    setDateRange({ from: "", to: "" });
    setBloodGroupFilter("all");
    setCoordinatorFilter("all");
    setCurrentPage(1);
  };

  const handleViewDetails = (donation: Donation) => {
    setSelectedDonation(donation);
    setShowQuickView(true);
  };

  const handleEdit = (donation: Donation) => {
    setEditDonation(donation);
    setShowEditDialog(true);
  };

  const handleEditSaved = () => {
    toast.success("Donation updated successfully");
    fetchData();
  };

  const handleResubmit = async (id: string) => {
    try {
      await resubmitDonation(id);
      toast.success("Donation resubmitted for review!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to resubmit donation");
    }
  };

  const handleExport = () => {
    const headers = ["Donor Name", "Email", "Phone", "Amount", "Payment Mode", "Event", "Date", "Transaction ID", "Blood Group", "Added By", "Notes", "Payment Screenshot"];
    const rows = filteredAndSortedDonations.map((d) => [
      d.donorName,
      d.donorEmail || "-",
      d.donorPhone || "-",
      formatCurrency(Number(d.amount)),
      d.paymentMode.replace("_", " ").toUpperCase(),
      d.event?.name || "General Fund",
      formatDate(d.donationDate),
      d.transactionId || "-",
      d.bloodGroup || "-",
      d.submitter?.fullName || "-",
      d.notes || "-",
      d.screenshotUrl || "-",
    ]);

    const totalAmount = filteredAndSortedDonations.reduce((sum, d) => sum + Number(d.amount), 0);
    const avgDonation = filteredAndSortedDonations.length > 0 ? totalAmount / filteredAndSortedDonations.length : 0;

    const summary = [
      { label: "Total Donations", value: filteredAndSortedDonations.length.toString() },
      { label: "Total Amount", value: formatCurrency(totalAmount) },
      { label: "Average Donation", value: formatCurrency(avgDonation) },
      { label: "Export Date", value: new Date().toLocaleDateString("en-IN") },
    ];

    setExportData({
      headers,
      rows,
      title: "Donations Report",
      subtitle: hasActiveFilters ? "Filtered Results" : "All Donations",
      clubName: clubName,
      summary,
    });
    setShowExportPreview(true);
  };

  const handleSheetsExport = async () => {
    setSheetsExporting(true);
    try {
      const result = await exportDonationsToSheets();
      toast.success(`✅ Sheet created with ${result.count} donations!`, {
        action: { label: "Open Sheet", onClick: () => window.open(result.url, "_blank") },
        duration: 8000,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to export to Google Sheets");
    } finally {
      setSheetsExporting(false);
    }
  };

  const hasActiveFilters = searchQuery !== "" || paymentModeFilter !== "all" || eventFilter !== "all" || dateFilter !== "all" || bloodGroupFilter !== "all" || coordinatorFilter !== "all";

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#10B981]" />
        <p className="text-gray-600 font-medium">Loading donations...</p>
      </div>
    );
  }

  // Empty state
  if (donations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Donations</h1>
            <p className="text-gray-600 mt-1 font-medium">Track and manage all donations</p>
          </div>
        </div>

        <Card className="border-2 border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="bg-[#D1FAE5] rounded-full w-24 h-24 flex items-center justify-center mb-6 ring-4 ring-[#D1FAE5]/50">
              <Heart className="h-12 w-12 text-[#10B981]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No donations yet</h3>
            <p className="text-sm text-gray-600 mb-8 max-w-md text-center">
              Start tracking donations by adding your first entry
            </p>
            <Link href="/donations/new">
              <Button className="bg-[#10B981] hover:bg-[#059669] text-white shadow-lg h-12 px-8">
                <Plus className="mr-2 h-5 w-5" />
                Add First Donation
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#D1FAE5] p-2.5 sm:p-3 rounded-xl border-2 border-[#10B981] shrink-0">
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900">Donations</h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Manage and track records</p>
          </div>
        </div>

        <Link href="/donations/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-[#10B981] hover:bg-[#059669] text-white shadow-lg h-11 px-6 rounded-xl font-semibold">
            <Plus className="mr-2 h-5 w-5" />
            Add Donation
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <DonationStats {...stats} />

      {/* Filters */}
      <DonationFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        paymentModeFilter={paymentModeFilter}
        onPaymentModeChange={setPaymentModeFilter}
        eventFilter={eventFilter}
        onEventFilterChange={setEventFilter}
        events={events}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        bloodGroupFilter={bloodGroupFilter}
        onBloodGroupFilterChange={setBloodGroupFilter}
        coordinatorFilter={coordinatorFilter}
        onCoordinatorFilterChange={setCoordinatorFilter}
        coordinators={coordinators}
        onClearFilters={handleClearFilters}
        onExport={handleExport}
        onSheetsExport={handleSheetsExport}
        sheetsExporting={sheetsExporting}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Results Info */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-700">
            Showing {filteredAndSortedDonations.length} of {donations.length} donations
          </span>
        </div>
      )}

      {/* Table */}
      <DonationTable
        donations={paginatedDonations}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        isAdmin={isAdmin}
        currentMemberId={currentMemberId}
        currentRole={currentRole}
        onResubmit={handleResubmit}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredAndSortedDonations.length}
        />
      )}

      {/* Quick View Dialog */}
      <DonationQuickView
        donation={selectedDonation}
        open={showQuickView}
        onClose={() => setShowQuickView(false)}
        onEdit={isAdmin ? handleEdit : undefined}
      />

      {/* Edit Dialog (admin only) */}
      <DonationEditDialog
        donation={editDonation}
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSaved={handleEditSaved}
      />

      {/* Export Preview Dialog */}
      {exportData && (
        <ExportPreviewDialog
          open={showExportPreview}
          onClose={() => setShowExportPreview(false)}
          data={exportData}
        />
      )}
    </div>
  );
}

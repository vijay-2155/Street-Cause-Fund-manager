"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatCurrency as exportFormatCurrency, formatDate as exportFormatDate } from "@/lib/export-utils";
import { ExportPreviewDialog } from "@/components/export-preview-dialog";
import {
  Plus,
  Loader2,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar as CalendarIcon,
  FileText,
  ImageIcon
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getExpenses } from "@/app/actions/expenses";
import { exportExpensesToSheets } from "@/app/actions/google-export";
import { ExpenseFilters } from "@/components/expenses/expense-filters";

const statusColors: Record<string, string> = {
  pending: "bg-[#FFF3EE] text-[#FF6B35] border-[#FF6B35]",
  approved: "bg-[#D1FAE5] text-[#10B981] border-[#10B981]",
  rejected: "bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

const categoryLabels: Record<string, string> = {
  food: "Food",
  supplies: "Supplies",
  transport: "Transport",
  venue: "Venue",
  printing: "Printing",
  medical: "Medical",
  donation_forward: "Donation Forward",
  other: "Other",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [submitterFilter, setSubmitterFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [clubName, setClubName] = useState("Street Cause");
  const [sheetsExporting, setSheetsExporting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const [expensesData, clubSettings] = await Promise.all([
        getExpenses(),
        import("@/app/actions/settings").then(m => m.getClubSettings()).catch(() => null)
      ]);
      setExpenses(expensesData || []);
      if (clubSettings?.name) {
        setClubName(clubSettings.name);
      }
    } catch (error: any) {
      console.error("Error fetching expenses:", error);
      toast.error(error.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const submitters = useMemo(() => {
    const names = new Set<string>();
    expenses.forEach((e) => {
      if (e.submitter?.fullName) names.add(e.submitter.fullName);
    });
    return Array.from(names).sort();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        searchQuery === "" ||
        expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
      const matchesSubmitter =
        submitterFilter === "all" || expense.submitter?.fullName === submitterFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesSubmitter;
    });
  }, [expenses, searchQuery, statusFilter, categoryFilter, submitterFilter]);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredExpenses.slice(startIndex, endIndex);
  }, [filteredExpenses, currentPage]);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const stats = useMemo(() => {
    const totalApproved = expenses
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalPending = expenses
      .filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalRejected = expenses
      .filter((e) => e.status === "rejected")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const approvedCount = expenses.filter((e) => e.status === "approved").length;
    const pendingCount = expenses.filter((e) => e.status === "pending").length;
    const rejectedCount = expenses.filter((e) => e.status === "rejected").length;

    return {
      totalApproved,
      totalPending,
      totalRejected,
      approvedCount,
      pendingCount,
      rejectedCount,
    };
  }, [expenses]);

  const handleExport = () => {
    // Prepare export data
    const headers = ["Title", "Amount", "Category", "Status", "Event", "Date", "Submitter", "Description", "Bill/Receipt"];
    const rows = filteredExpenses.map((e) => [
      e.title,
      exportFormatCurrency(Number(e.amount)),
      categoryLabels[e.category],
      e.status.charAt(0).toUpperCase() + e.status.slice(1),
      e.event?.name || "-",
      exportFormatDate(e.expenseDate),
      e.submitter?.fullName || "-",
      e.description || "-",
      e.receiptUrl || "-",
    ]);

    // Calculate summary
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const approvedAmount = filteredExpenses
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const pendingAmount = filteredExpenses
      .filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const summary = [
      { label: "Total Expenses", value: filteredExpenses.length.toString() },
      { label: "Total Amount", value: exportFormatCurrency(totalAmount) },
      { label: "Approved", value: exportFormatCurrency(approvedAmount) },
      { label: "Pending", value: exportFormatCurrency(pendingAmount) },
    ];

    setExportData({
      headers,
      rows,
      title: "Expenses Report",
      subtitle: hasActiveFilters ? "Filtered Results" : "All Expenses",
      clubName: clubName,
      summary,
    });
    setShowExportPreview(true);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSubmitterFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    submitterFilter !== "all";

  const handleSheetsExport = async () => {
    setSheetsExporting(true);
    try {
      const result = await exportExpensesToSheets();
      toast.success(`✅ Sheet created with ${result.count} expenses!`, {
        action: { label: "Open Sheet", onClick: () => window.open(result.url, "_blank") },
        duration: 8000,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to export to Google Sheets");
    } finally {
      setSheetsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#8B5CF6]" />
        <p className="text-gray-600 font-medium">Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-[#F5F3FF] p-2.5 sm:p-3 rounded-xl border-2 border-[#8B5CF6] shrink-0">
            <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-[#8B5CF6]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900">Expenses</h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Track and manage expenses</p>
          </div>
        </div>
        <Link href="/expenses/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-lg h-11 px-6 font-semibold rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Submit Expense
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-[#10B981] shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Approved
                </p>
                <p className="text-3xl font-bold text-[#10B981] mt-2">
                  {formatCurrency(stats.totalApproved)}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {stats.approvedCount} {stats.approvedCount === 1 ? "expense" : "expenses"}
                </p>
              </div>
              <div className="bg-[#D1FAE5] p-3 rounded-xl">
                <CheckCircle className="h-7 w-7 text-[#10B981]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#FF6B35] shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Pending
                </p>
                <p className="text-3xl font-bold text-[#FF6B35] mt-2">
                  {formatCurrency(stats.totalPending)}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {stats.pendingCount} {stats.pendingCount === 1 ? "expense" : "expenses"}
                </p>
              </div>
              <div className="bg-[#FFF3EE] p-3 rounded-xl">
                <Clock className="h-7 w-7 text-[#FF6B35]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#EF4444] shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Rejected
                </p>
                <p className="text-3xl font-bold text-[#EF4444] mt-2">
                  {formatCurrency(stats.totalRejected)}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {stats.rejectedCount} {stats.rejectedCount === 1 ? "expense" : "expenses"}
                </p>
              </div>
              <div className="bg-[#FEF2F2] p-3 rounded-xl">
                <XCircle className="h-7 w-7 text-[#EF4444]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ExpenseFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        submitterFilter={submitterFilter}
        onSubmitterFilterChange={setSubmitterFilter}
        submitters={submitters}
        onClearFilters={handleClearFilters}
        onExport={handleExport}
        onSheetsExport={handleSheetsExport}
        sheetsExporting={sheetsExporting}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <Card className="border-2 border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="bg-[#F5F3FF] rounded-full w-24 h-24 flex items-center justify-center mb-6 ring-4 ring-[#F5F3FF]/50">
              <Receipt className="h-12 w-12 text-[#8B5CF6]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {expenses.length === 0 ? "No expenses yet" : "No matching expenses"}
            </h3>
            <p className="text-sm text-gray-600 max-w-md text-center mb-6">
              {expenses.length === 0
                ? "Submit your first expense to get started"
                : "Try adjusting your filters to see more results"}
            </p>
            {expenses.length === 0 && (
              <Link href="/expenses/new">
                <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit First Expense
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedExpenses.map((expense, idx) => {
            const StatusIcon = statusIcons[expense.status];
            return (
              <Card
                key={expense.id}
                className="border-2 border-gray-200 hover:border-[#8B5CF6] hover:shadow-lg transition-all"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    {/* Left Section - Expense Details */}
                    <div className="flex-1 space-y-4">
                      {/* Title and Category */}
                      <div className="flex items-start gap-3 flex-wrap">
                        <div className="bg-[#F5F3FF] p-2 rounded-lg">
                          <Receipt className="h-5 w-5 text-[#8B5CF6]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {expense.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-[#F5F3FF] text-[#8B5CF6] border-[#8B5CF6] border font-semibold">
                              {categoryLabels[expense.category]}
                            </Badge>
                            <Badge className={`${statusColors[expense.status]} border-2 font-semibold`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                            </Badge>
                            {expense.event && (
                              <Badge variant="outline" className="border-gray-300 text-gray-700 font-medium">
                                {expense.event.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {expense.description && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {expense.description}
                          </p>
                        </div>
                      )}

                      {/* Meta Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            Submitted by: <span className="text-gray-900">{expense.submitter?.fullName || "Unknown"}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            Date: <span className="text-gray-900">{formatDate(expense.expenseDate)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Amount + Bill */}
                    <div className="flex flex-col items-end gap-3 md:min-w-[180px]">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                          Amount
                        </p>
                        <p className="text-3xl font-bold text-[#8B5CF6]">
                          {formatCurrency(Number(expense.amount))}
                        </p>
                      </div>
                      {expense.receiptUrl ? (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#8B5CF6] bg-[#F5F3FF] border border-[#8B5CF6] px-3 py-1.5 rounded-full hover:bg-[#EDE9FE] transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          View Bill
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full">
                          <ImageIcon className="h-3.5 w-3.5" />
                          No bill
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-2 border-gray-200 bg-white rounded-xl p-4">
              <div className="text-sm text-gray-600 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of{" "}
                {filteredExpenses.length} expenses
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-2 border-gray-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                      return false;
                    })
                    .map((page, idx, arr) => {
                      if (idx > 0 && page - arr[idx - 1] > 1) {
                        return (
                          <span key={`ellipsis-${page}`} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? "bg-[#8B5CF6] text-white hover:bg-[#7C3AED] border-2 border-[#8B5CF6]"
                              : "border-2 border-gray-300"
                          }
                        >
                          {page}
                        </Button>
                      );
                    })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-2 border-gray-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

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

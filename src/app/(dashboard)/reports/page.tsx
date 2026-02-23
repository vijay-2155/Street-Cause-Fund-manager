"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileText, Filter, TrendingUp, TrendingDown, ImageIcon, ExternalLink, Receipt, Camera, Sheet, ExternalLink as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatCurrency as exportFormatCurrency, formatDate as exportFormatDate } from "@/lib/export-utils";
import { ExportPreviewDialog } from "@/components/export-preview-dialog";
import {
  getDonationsReport,
  getExpensesReport,
  getEventsReport,
  getMembersReport,
  getFinancialSummary,
} from "@/app/actions/reports";
import { getEventsForSelect } from "@/app/actions/expenses";
import { exportDonationsToSheets, exportExpensesToSheets } from "@/app/actions/google-export";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("donations");
  const [summary, setSummary] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  // Donations state
  const [donationsData, setDonationsData] = useState<any>(null);
  const [donationFilters, setDonationFilters] = useState({
    startDate: "",
    endDate: "",
    eventId: "",
    paymentMode: "",
  });
  const [donationCoordinatorFilter, setDonationCoordinatorFilter] = useState("all");

  // Expenses state
  const [expensesData, setExpensesData] = useState<any>(null);
  const [expenseFilters, setExpenseFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
    category: "",
    eventId: "",
  });

  // Events state
  const [eventsData, setEventsData] = useState<any>(null);

  // Members state
  const [membersData, setMembersData] = useState<any>(null);

  // Bills gallery state
  const [billsGalleryType, setBillsGalleryType] = useState<"all" | "expenses" | "donations">("all");

  // Export preview state
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [clubName, setClubName] = useState("Street Cause");

  // Google Sheets export state
  const [sheetsExporting, setSheetsExporting] = useState<"donations" | "expenses" | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [summaryData, eventsData, clubSettings] = await Promise.all([
        getFinancialSummary(),
        getEventsForSelect(),
        import("@/app/actions/settings").then(m => m.getClubSettings()).catch(() => null)
      ]);
      setSummary(summaryData);
      setEvents(eventsData || []);
      if (clubSettings?.name) {
        setClubName(clubSettings.name);
      }
      await fetchDonationsReport();
    } catch (error: any) {
      console.error("Error fetching initial data:", error);
      toast.error(error.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchDonationsReport = async () => {
    try {
      const data = await getDonationsReport(donationFilters);
      setDonationsData(data);
      setDonationCoordinatorFilter("all");
    } catch (error: any) {
      toast.error(error.message || "Failed to load donations report");
    }
  };

  const fetchExpensesReport = async () => {
    try {
      const data = await getExpensesReport(expenseFilters);
      setExpensesData(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load expenses report");
    }
  };

  const fetchEventsReport = async () => {
    try {
      const data = await getEventsReport();
      setEventsData(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load events report");
    }
  };

  const fetchMembersReport = async () => {
    try {
      const data = await getMembersReport();
      setMembersData(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load members report");
    }
  };

  const fetchBillsData = async () => {
    const tasks: Promise<void>[] = [];
    if (!donationsData) tasks.push(fetchDonationsReport());
    if (!expensesData) tasks.push(fetchExpensesReport());
    if (tasks.length > 0) await Promise.all(tasks);
  };

  const donationCoordinators = useMemo(() => {
    const names = new Set<string>();
    (donationsData?.data || []).forEach((d: any) => {
      if (d.submitter?.fullName) names.add(d.submitter.fullName);
    });
    return Array.from(names).sort();
  }, [donationsData]);

  const filteredDonationsForReport = useMemo(() => {
    if (!donationsData?.data) return donationsData;
    if (donationCoordinatorFilter === "all") return donationsData;
    const filtered = donationsData.data.filter(
      (d: any) => d.submitter?.fullName === donationCoordinatorFilter
    );
    const total = filtered.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
    return {
      data: filtered,
      summary: {
        total,
        count: filtered.length,
        average: filtered.length > 0 ? total / filtered.length : 0,
      },
    };
  }, [donationsData, donationCoordinatorFilter]);

  const handleExportDonations = () => {
    const data = filteredDonationsForReport;
    if (!data || !data.data || data.data.length === 0) {
      toast.error("No donations data to export");
      return;
    }

    const headers = ["Donor Name", "Email", "Phone", "Amount", "Payment Mode", "Event", "Date", "Added By", "Payment Screenshot"];
    const rows = data.data.map((d: any) => [
      d.donorName || "-",
      d.donorEmail || "-",
      d.donorPhone || "-",
      exportFormatCurrency(Number(d.amount)),
      d.paymentMode?.replace("_", " ").toUpperCase() || "-",
      d.event?.name || "General Fund",
      exportFormatDate(d.donationDate),
      d.submitter?.fullName || "-",
      d.screenshotUrl || "-",
    ]);

    const summary = [
      { label: "Total Donations", value: data.summary?.count?.toString() || "0" },
      { label: "Total Amount", value: exportFormatCurrency(data.summary?.total || 0) },
      { label: "Average Donation", value: exportFormatCurrency(data.summary?.average || 0) },
      { label: "Report Period", value: donationFilters.startDate && donationFilters.endDate ? `${exportFormatDate(donationFilters.startDate)} - ${exportFormatDate(donationFilters.endDate)}` : "All Time" },
    ];

    setExportData({
      headers,
      rows,
      title: "Donations Report",
      subtitle: donationFilters.startDate || donationCoordinatorFilter !== "all" ? "Filtered Results" : "All Donations",
      clubName: clubName,
      summary,
    });
    setShowExportPreview(true);
  };

  const handleExportExpenses = () => {
    if (!expensesData || !expensesData.data || expensesData.data.length === 0) {
      toast.error("No expenses data to export");
      return;
    }

    const headers = ["Title", "Amount", "Category", "Status", "Event", "Date", "Submitter"];
    const rows = expensesData.data.map((e: any) => [
      e.title || "-",
      exportFormatCurrency(Number(e.amount)),
      e.category?.replace("_", " ").toUpperCase() || "-",
      e.status?.charAt(0).toUpperCase() + e.status?.slice(1) || "-",
      e.eventName || "-",
      exportFormatDate(e.expenseDate),
      e.submitterName || "-",
    ]);

    const summary = [
      { label: "Total Expenses", value: expensesData.summary?.total?.toString() || "0" },
      { label: "Total Amount", value: exportFormatCurrency(expensesData.summary?.totalAmount || 0) },
      { label: "Approved", value: exportFormatCurrency(expensesData.summary?.approvedAmount || 0) },
      { label: "Pending", value: exportFormatCurrency(expensesData.summary?.pendingAmount || 0) },
    ];

    setExportData({
      headers,
      rows,
      title: "Expenses Report",
      subtitle: expenseFilters.startDate ? "Filtered Results" : "All Expenses",
      clubName: clubName,
      summary,
    });
    setShowExportPreview(true);
  };

  const handleExportEvents = () => {
    if (!eventsData || !eventsData.data || eventsData.data.length === 0) {
      toast.error("No events data to export");
      return;
    }

    const headers = ["Event Name", "Description", "Start Date", "End Date", "Status", "Target Amount", "Raised Amount", "Total Expenses"];
    const rows = eventsData.data.map((e: any) => [
      e.name || "-",
      e.description || "-",
      exportFormatDate(e.startDate),
      e.endDate ? exportFormatDate(e.endDate) : "-",
      e.status?.charAt(0).toUpperCase() + e.status?.slice(1) || "-",
      exportFormatCurrency(Number(e.targetAmount) || 0),
      exportFormatCurrency(Number(e.raisedAmount) || 0),
      exportFormatCurrency(Number(e.totalExpenses) || 0),
    ]);

    const summary = [
      { label: "Total Events", value: eventsData.summary?.total?.toString() || "0" },
      { label: "Active Events", value: eventsData.summary?.active?.toString() || "0" },
      { label: "Total Raised", value: exportFormatCurrency(eventsData.summary?.totalRaised || 0) },
      { label: "Total Expenses", value: exportFormatCurrency(eventsData.summary?.totalExpenses || 0) },
    ];

    setExportData({
      headers,
      rows,
      title: "Events Report",
      subtitle: "All Events",
      clubName: clubName,
      summary,
    });
    setShowExportPreview(true);
  };

  const handleExportMembers = () => {
    if (!membersData || !membersData.data || membersData.data.length === 0) {
      toast.error("No members data to export");
      return;
    }

    const headers = ["Name", "Email", "Role", "Status", "Join Date"];
    const rows = membersData.data.map((m: any) => [
      m.fullName || "-",
      m.email || "-",
      m.role?.charAt(0).toUpperCase() + m.role?.slice(1) || "-",
      m.isActive ? "Active" : "Inactive",
      exportFormatDate(m.joinedAt),
    ]);

    const summary = [
      { label: "Total Members", value: membersData.summary?.total?.toString() || "0" },
      { label: "Active Members", value: membersData.summary?.active?.toString() || "0" },
      { label: "Admins", value: membersData.summary?.admins?.toString() || "0" },
      { label: "Treasurers", value: membersData.summary?.treasurers?.toString() || "0" },
    ];

    setExportData({
      headers,
      rows,
      title: "Members Report",
      subtitle: "All Team Members",
      clubName: clubName,
      summary,
    });
    setShowExportPreview(true);
  };

  const handleSheetsExportDonations = async () => {
    setSheetsExporting("donations");
    try {
      const result = await exportDonationsToSheets(donationFilters);
      toast.success(`✅ Sheet created with ${result.count} donations!`, {
        action: { label: "Open Sheet", onClick: () => window.open(result.url, "_blank") },
        duration: 8000,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to export to Google Sheets");
    } finally {
      setSheetsExporting(null);
    }
  };

  const handleSheetsExportExpenses = async () => {
    setSheetsExporting("expenses");
    try {
      const result = await exportExpensesToSheets(expenseFilters);
      toast.success(`✅ Sheet created with ${result.count} expenses!`, {
        action: { label: "Open Sheet", onClick: () => window.open(result.url, "_blank") },
        duration: 8000,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to export to Google Sheets");
    } finally {
      setSheetsExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#0066FF]" />
        <p className="text-gray-600 font-medium">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-[#E6F2FF] p-2.5 sm:p-3 rounded-xl border-2 border-[#0066FF] shrink-0">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-[#0066FF]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900">Reports</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Financial reports &amp; analytics</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-2 border-[#10B981] shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg sm:text-2xl font-bold text-[#10B981]">
                  {formatCurrency(summary?.totalDonations || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {summary?.donationsCount || 0} donations
                </p>
              </div>
              <div className="bg-[#D1FAE5] p-3 rounded-xl">
                <TrendingUp className="h-7 w-7 text-[#10B981]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg sm:text-2xl font-bold text-red-600">
                  {formatCurrency(summary?.totalExpenses || 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {summary?.expensesCount || 0} approved
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">
                {formatCurrency(summary?.netAmount || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Available funds</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-amber-600">
                {formatCurrency(summary?.pendingExpenses || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {summary?.pendingCount || 0} expenses
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex w-full overflow-x-auto scrollbar-hide">
          <TabsTrigger value="donations" onClick={() => !donationsData && fetchDonationsReport()}>
            Donations
          </TabsTrigger>
          <TabsTrigger value="expenses" onClick={() => !expensesData && fetchExpensesReport()}>
            Expenses
          </TabsTrigger>
          <TabsTrigger value="events" onClick={() => !eventsData && fetchEventsReport()}>
            Events
          </TabsTrigger>
          <TabsTrigger value="members" onClick={() => !membersData && fetchMembersReport()}>
            Members
          </TabsTrigger>
          <TabsTrigger value="bills" onClick={fetchBillsData}>
            Bills Gallery
          </TabsTrigger>
        </TabsList>

        {/* Donations Report */}
        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Donations Report
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSheetsExportDonations}
                    disabled={!donationsData || sheetsExporting === "donations"}
                    size="sm"
                    className="h-9 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold shadow-sm hover:shadow-md transition-all rounded-lg flex items-center gap-2"
                  >
                    {sheetsExporting === "donations" ? (
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    ) : (
                      <Sheet className="h-4 w-4 shrink-0" />
                    )}
                    {sheetsExporting === "donations" ? "Exporting..." : "Google Sheets"}
                  </Button>
                  <Button
                    onClick={handleExportDonations}
                    disabled={!donationsData}
                    size="sm"
                    className="h-9 px-4 bg-[#10B981] hover:bg-[#059669] text-white font-semibold shadow-sm hover:shadow-md transition-all rounded-lg flex items-center gap-2"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    Export
                    <span className="text-[10px] font-normal bg-white/25 px-1.5 py-0.5 rounded-full">XLS·PDF</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="don-start">Start Date</Label>
                  <Input
                    id="don-start"
                    type="date"
                    value={donationFilters.startDate}
                    onChange={(e) => setDonationFilters({ ...donationFilters, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="don-end">End Date</Label>
                  <Input
                    id="don-end"
                    type="date"
                    value={donationFilters.endDate}
                    onChange={(e) => setDonationFilters({ ...donationFilters, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="don-event">Event</Label>
                  <Select
                    value={donationFilters.eventId || "all"}
                    onValueChange={(value) => setDonationFilters({ ...donationFilters, eventId: value === "all" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={fetchDonationsReport} className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </div>

              {/* Coordinator filter (client-side, shown after data loads) */}
              {donationCoordinators.length > 0 && (
                <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide shrink-0">Added by:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setDonationCoordinatorFilter("all")}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                        donationCoordinatorFilter === "all"
                          ? "bg-[#10B981] border-[#10B981] text-white"
                          : "bg-white border-gray-300 text-gray-600 hover:border-[#10B981]"
                      }`}
                    >
                      All
                    </button>
                    {donationCoordinators.map((name) => (
                      <button
                        key={name}
                        onClick={() => setDonationCoordinatorFilter(name)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                          donationCoordinatorFilter === name
                            ? "bg-[#10B981] border-[#10B981] text-white"
                            : "bg-white border-gray-300 text-gray-600 hover:border-[#10B981]"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredDonationsForReport && (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-600">Total Amount</p>
                      <p className="text-xl font-bold text-emerald-600">
                        {formatCurrency(filteredDonationsForReport.summary.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Total Count</p>
                      <p className="text-xl font-bold">{filteredDonationsForReport.summary.count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Average</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(filteredDonationsForReport.summary.average)}
                      </p>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Donor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Mode</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Event</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Added By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredDonationsForReport.data.map((donation: any) => (
                          <tr key={donation.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm">{formatDate(donation.donationDate)}</td>
                            <td className="px-4 py-3 text-sm">{donation.donorName}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
                              {formatCurrency(Number(donation.amount))}
                            </td>
                            <td className="px-4 py-3 text-sm capitalize">{donation.paymentMode?.replace("_", " ")}</td>
                            <td className="px-4 py-3 text-sm">{donation.event?.name || "General Fund"}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{donation.submitter?.fullName || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Report */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Expenses Report
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSheetsExportExpenses}
                    disabled={!expensesData || sheetsExporting === "expenses"}
                    size="sm"
                    className="h-9 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold shadow-sm hover:shadow-md transition-all rounded-lg flex items-center gap-2"
                  >
                    {sheetsExporting === "expenses" ? (
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    ) : (
                      <Sheet className="h-4 w-4 shrink-0" />
                    )}
                    {sheetsExporting === "expenses" ? "Exporting..." : "Google Sheets"}
                  </Button>
                  <Button
                    onClick={handleExportExpenses}
                    disabled={!expensesData}
                    size="sm"
                    className="h-9 px-4 bg-[#10B981] hover:bg-[#059669] text-white font-semibold shadow-sm hover:shadow-md transition-all rounded-lg flex items-center gap-2"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    Export
                    <span className="text-[10px] font-normal bg-white/25 px-1.5 py-0.5 rounded-full">XLS·PDF</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="exp-start">Start Date</Label>
                  <Input
                    id="exp-start"
                    type="date"
                    value={expenseFilters.startDate}
                    onChange={(e) => setExpenseFilters({ ...expenseFilters, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-end">End Date</Label>
                  <Input
                    id="exp-end"
                    type="date"
                    value={expenseFilters.endDate}
                    onChange={(e) => setExpenseFilters({ ...expenseFilters, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-status">Status</Label>
                  <Select
                    value={expenseFilters.status || "all"}
                    onValueChange={(value) => setExpenseFilters({ ...expenseFilters, status: value === "all" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-category">Category</Label>
                  <Select
                    value={expenseFilters.category || "all"}
                    onValueChange={(value) => setExpenseFilters({ ...expenseFilters, category: value === "all" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="venue">Venue</SelectItem>
                      <SelectItem value="printing">Printing</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="donation_forward">Donation Forward</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={fetchExpensesReport} className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </div>

              {expensesData && (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-600">Total</p>
                      <p className="text-lg font-bold">{formatCurrency(expensesData.summary.total)}</p>
                      <p className="text-xs text-slate-500">{expensesData.summary.count} expenses</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Approved</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(expensesData.summary.approved)}
                      </p>
                      <p className="text-xs text-slate-500">{expensesData.summary.approvedCount} expenses</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Pending</p>
                      <p className="text-lg font-bold text-amber-600">
                        {formatCurrency(expensesData.summary.pending)}
                      </p>
                      <p className="text-xs text-slate-500">{expensesData.summary.pendingCount} expenses</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Rejected</p>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(expensesData.summary.rejected)}
                      </p>
                      <p className="text-xs text-slate-500">{expensesData.summary.rejectedCount} expenses</p>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Submitted By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {expensesData.data.map((expense: any) => (
                          <tr key={expense.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm">{formatDate(expense.expenseDate)}</td>
                            <td className="px-4 py-3 text-sm">{expense.title}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-red-600">
                              {formatCurrency(Number(expense.amount))}
                            </td>
                            <td className="px-4 py-3 text-sm capitalize">{expense.category}</td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`${
                                  expense.status === "approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : expense.status === "pending"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                                } text-xs`}
                              >
                                {expense.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">{expense.submitter?.fullName || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Report */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Events Performance</CardTitle>
                <Button
                  onClick={handleExportEvents}
                  disabled={!eventsData}
                  size="sm"
                  className="h-9 px-4 bg-[#10B981] hover:bg-[#059669] text-white font-semibold shadow-sm hover:shadow-md transition-all rounded-lg flex items-center gap-2"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  Export
                  <span className="text-[10px] font-normal bg-white/25 px-1.5 py-0.5 rounded-full">XLS·PDF</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {eventsData && (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-600">Total Events</p>
                      <p className="text-2xl font-bold">{eventsData.summary.totalEvents}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Total Donations</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(eventsData.summary.totalDonations)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(eventsData.summary.totalExpenses)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Net Amount</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(eventsData.summary.netAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Event</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Donations</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Expenses</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Net Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {eventsData.data.map((event: any) => (
                          <tr key={event.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-semibold">{event.name}</div>
                                <div className="text-xs text-slate-500">
                                  {event.donationsCount} donations • {event.expensesCount} expenses
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className="text-xs capitalize">{event.status}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
                              {formatCurrency(event.donationsTotal)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-red-600">
                              {formatCurrency(event.expensesTotal)}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-blue-600">
                              {formatCurrency(event.netAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Report */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Member Activity</CardTitle>
                <Button
                  onClick={handleExportMembers}
                  disabled={!membersData}
                  size="sm"
                  className="h-9 px-4 bg-[#10B981] hover:bg-[#059669] text-white font-semibold shadow-sm hover:shadow-md transition-all rounded-lg flex items-center gap-2"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  Export
                  <span className="text-[10px] font-normal bg-white/25 px-1.5 py-0.5 rounded-full">XLS·PDF</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {membersData && (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-600">Total Members</p>
                      <p className="text-2xl font-bold">{membersData.summary.totalMembers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Active</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {membersData.summary.activeMembers}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Inactive</p>
                      <p className="text-2xl font-bold text-slate-600">
                        {membersData.summary.inactiveMembers}
                      </p>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Member</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Donations Collected</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Expenses Submitted</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Approvals</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {membersData.data.map((member: any) => (
                          <tr key={member.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-semibold">{member.fullName}</div>
                                <div className="text-xs text-slate-500">{member.email}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className="text-xs capitalize">{member.role}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-semibold text-emerald-600">
                                  {formatCurrency(member.donationsCollected)}
                                </div>
                                <div className="text-xs text-slate-500">{member.donationsCount} donations</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-semibold text-red-600">
                                  {formatCurrency(member.expensesSubmitted)}
                                </div>
                                <div className="text-xs text-slate-500">{member.expensesCount} expenses</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{member.approvalsCount} approvals</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Bills Gallery */}
        <TabsContent value="bills" className="space-y-4">
          {(() => {
            const expenseBills = (expensesData?.data || [])
              .filter((e: any) => e.receiptUrl)
              .map((e: any) => ({
                id: e.id,
                type: "expense" as const,
                title: e.title,
                amount: Number(e.amount),
                date: e.expenseDate,
                imageUrl: e.receiptUrl,
                submitter: e.submitter?.fullName || "-",
                status: e.status,
              }));

            const donationScreenshots = (donationsData?.data || [])
              .filter((d: any) => d.screenshotUrl)
              .map((d: any) => ({
                id: d.id,
                type: "donation" as const,
                title: d.donorName,
                amount: Number(d.amount),
                date: d.donationDate,
                imageUrl: d.screenshotUrl,
                submitter: d.submitter?.fullName || "-",
                status: "approved",
              }));

            const allBills = [...expenseBills, ...donationScreenshots].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            const filteredBills =
              billsGalleryType === "all"
                ? allBills
                : billsGalleryType === "expenses"
                ? expenseBills
                : donationScreenshots;

            return (
              <Card>
                <CardHeader className="border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-[#8B5CF6]" />
                      <div>
                        <h3 className="font-bold text-gray-900">Bills &amp; Receipts Gallery</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {filteredBills.length} {filteredBills.length === 1 ? "item" : "items"} ·{" "}
                          {expenseBills.length} expense bills · {donationScreenshots.length} payment screenshots
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(["all", "expenses", "donations"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setBillsGalleryType(type)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-colors ${
                            billsGalleryType === type
                              ? type === "expenses"
                                ? "bg-[#F5F3FF] border-[#8B5CF6] text-[#8B5CF6]"
                                : type === "donations"
                                ? "bg-[#D1FAE5] border-[#10B981] text-[#10B981]"
                                : "bg-gray-900 border-gray-900 text-white"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          {type === "all" ? "All" : type === "expenses" ? "Expense Bills" : "Payment Screenshots"}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {filteredBills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                        <ImageIcon className="h-10 w-10 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium">No bills or receipts found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {!donationsData && !expensesData
                          ? "Loading data..."
                          : "Upload bills when submitting expenses or donation screenshots"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {filteredBills.map((item: any) => (
                        <a
                          key={`${item.type}-${item.id}`}
                          href={item.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block rounded-xl border-2 border-gray-200 overflow-hidden hover:border-[#8B5CF6] hover:shadow-lg transition-all"
                        >
                          {/* Thumbnail */}
                          <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                              }}
                            />
                            {/* Fallback icon */}
                            <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
                              {item.type === "expense" ? (
                                <Receipt className="h-10 w-10 text-gray-300" />
                              ) : (
                                <Camera className="h-10 w-10 text-gray-300" />
                              )}
                            </div>
                            {/* Open overlay on hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {/* Type badge */}
                            <div className="absolute top-2 left-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                item.type === "expense"
                                  ? "bg-[#F5F3FF] border-[#8B5CF6] text-[#8B5CF6]"
                                  : "bg-[#D1FAE5] border-[#10B981] text-[#10B981]"
                              }`}>
                                {item.type === "expense" ? "Bill" : "Payment"}
                              </span>
                            </div>
                          </div>
                          {/* Info */}
                          <div className="p-2.5 bg-white">
                            <p className="text-xs font-semibold text-gray-900 truncate">{item.title}</p>
                            <p className={`text-xs font-bold mt-0.5 ${
                              item.type === "expense" ? "text-[#8B5CF6]" : "text-[#10B981]"
                            }`}>
                              {formatCurrency(item.amount)}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.date)}</p>
                            {item.submitter !== "-" && (
                              <p className="text-xs text-gray-400 truncate">{item.submitter}</p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>
      </Tabs>

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

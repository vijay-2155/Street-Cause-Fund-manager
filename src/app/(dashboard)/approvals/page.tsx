"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Receipt,
  Heart,
  User,
  Calendar as CalendarIcon,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPendingExpenses,
  approveExpense,
  rejectExpense,
  getPendingDonations,
  approveDonation,
  rejectDonation,
} from "@/app/actions/approvals";
import { RejectionDialog } from "@/components/approvals/rejection-dialog";

type Tab = "donations" | "expenses";

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("donations");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [pendingDonations, setPendingDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionDialog, setRejectionDialog] = useState<{
    open: boolean;
    id: string | null;
    title: string;
    type: "expense" | "donation";
  }>({ open: false, id: null, title: "", type: "donation" });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [exp, don] = await Promise.all([
        getPendingExpenses().catch(() => []),
        getPendingDonations().catch(() => []),
      ]);
      setExpenses(exp || []);
      setPendingDonations(don || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const donationStats = useMemo(() => ({
    totalAmount: pendingDonations.reduce((s, d) => s + Number(d.amount), 0),
    count: pendingDonations.length,
  }), [pendingDonations]);

  const expenseStats = useMemo(() => ({
    totalAmount: expenses.reduce((s, e) => s + Number(e.amount), 0),
    count: expenses.length,
  }), [expenses]);

  const handleApproveDonation = async (id: string) => {
    setProcessing(id);
    try {
      await approveDonation(id);
      toast.success("Donation approved and added to the donations list!");
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve donation");
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveExpense = async (id: string) => {
    setProcessing(id);
    try {
      await approveExpense(id);
      toast.success("Expense approved!");
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve expense");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectionDialog.id) return;
    setProcessing(rejectionDialog.id);
    try {
      if (rejectionDialog.type === "donation") {
        await rejectDonation(rejectionDialog.id, reason);
        toast.success("Donation rejected. The coordinator will be notified.");
      } else {
        await rejectExpense(rejectionDialog.id, reason);
        toast.success("Expense rejected.");
      }
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#10B981]" />
        <p className="text-gray-600 font-medium">Loading pending approvals...</p>
      </div>
    );
  }

  const totalPending = donationStats.count + expenseStats.count;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-[#10B981] to-[#059669] p-3 rounded-xl shadow-lg ring-4 ring-[#D1FAE5]">
          <CheckCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600 mt-1 font-medium">
            {totalPending === 0
              ? "All caught up — nothing to review"
              : `${totalPending} submission${totalPending !== 1 ? "s" : ""} awaiting your review`}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab("donations")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 -mb-0.5 transition-colors ${
            activeTab === "donations"
              ? "border-[#10B981] text-[#10B981]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Heart className="h-4 w-4" />
          Donations
          {donationStats.count > 0 && (
            <span className="bg-[#10B981] text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {donationStats.count}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 -mb-0.5 transition-colors ${
            activeTab === "expenses"
              ? "border-[#FF6B35] text-[#FF6B35]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Receipt className="h-4 w-4" />
          Expenses
          {expenseStats.count > 0 && (
            <span className="bg-[#FF6B35] text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {expenseStats.count}
            </span>
          )}
        </button>
      </div>

      {/* ── DONATIONS TAB ─────────────────────────────────────────────── */}
      {activeTab === "donations" && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2 border-[#10B981] shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Amount</p>
                    <p className="text-3xl font-bold text-[#10B981] mt-2">{formatCurrency(donationStats.totalAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Awaiting verification</p>
                  </div>
                  <div className="bg-[#D1FAE5] p-3 rounded-xl">
                    <Heart className="h-7 w-7 text-[#10B981]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Count</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{donationStats.count}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      {donationStats.count === 1 ? "donation" : "donations"} to verify
                    </p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-xl">
                    <Clock className="h-7 w-7 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {pendingDonations.length === 0 ? (
            <Card className="border-2 border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="bg-[#D1FAE5] rounded-full w-24 h-24 flex items-center justify-center mb-6">
                  <CheckCircle className="h-12 w-12 text-[#10B981]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">All donations verified!</h3>
                <p className="text-sm text-gray-600 max-w-md text-center">
                  No pending donation submissions. New coordinator submissions will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingDonations.map((donation, idx) => (
                <Card
                  key={donation.id}
                  className="border-2 border-amber-200 hover:border-[#10B981] hover:shadow-lg transition-all"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start gap-3 flex-wrap">
                          <div className="bg-[#D1FAE5] p-2 rounded-lg">
                            <Heart className="h-5 w-5 text-[#10B981]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{donation.donorName}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-gray-100 text-gray-700 border border-gray-300 font-semibold capitalize">
                                {donation.paymentMode.replace("_", " ")}
                              </Badge>
                              {donation.event && (
                                <Badge variant="outline" className="border-gray-300 text-gray-700 font-medium">
                                  {donation.event.name}
                                </Badge>
                              )}
                              {donation.screenshotUrl && (
                                <a
                                  href={donation.screenshotUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-2 py-1 rounded-full border border-blue-200"
                                >
                                  <ImageIcon className="h-3 w-3" />
                                  View Receipt
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        {donation.notes && (
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700">{donation.notes}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              By: <span className="text-gray-900">{donation.submitter?.fullName || "Unknown"}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              {formatDate(donation.donationDate)}
                            </span>
                          </div>
                          {donation.transactionId && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Receipt className="h-4 w-4 text-gray-400" />
                              <span className="font-mono text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                {donation.transactionId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-4 md:min-w-[200px]">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Amount</p>
                          <p className="text-3xl font-bold text-[#10B981]">{formatCurrency(Number(donation.amount))}</p>
                        </div>
                        <div className="flex gap-2 w-full">
                          <Button
                            onClick={() => handleApproveDonation(donation.id)}
                            disabled={processing === donation.id}
                            className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white shadow-lg h-11 font-semibold"
                          >
                            {processing === donation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setRejectionDialog({
                                open: true,
                                id: donation.id,
                                title: `donation from ${donation.donorName}`,
                                type: "donation",
                              })
                            }
                            disabled={processing === donation.id}
                            className="flex-1 border-2 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] h-11 font-semibold"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── EXPENSES TAB ──────────────────────────────────────────────── */}
      {activeTab === "expenses" && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2 border-[#FF6B35] shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Amount</p>
                    <p className="text-3xl font-bold text-[#FF6B35] mt-2">{formatCurrency(expenseStats.totalAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Awaiting your approval</p>
                  </div>
                  <div className="bg-[#FFF3EE] p-3 rounded-xl">
                    <Receipt className="h-7 w-7 text-[#FF6B35]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Count</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{expenseStats.count}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      {expenseStats.count === 1 ? "expense" : "expenses"} to review
                    </p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-xl">
                    <Clock className="h-7 w-7 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {expenses.length === 0 ? (
            <Card className="border-2 border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="bg-[#D1FAE5] rounded-full w-24 h-24 flex items-center justify-center mb-6">
                  <CheckCircle className="h-12 w-12 text-[#10B981]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
                <p className="text-sm text-gray-600 max-w-md text-center">
                  No pending expenses to review. New submissions will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense, idx) => (
                <Card
                  key={expense.id}
                  className="border-2 border-gray-200 hover:border-[#FF6B35] hover:shadow-lg transition-all"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start gap-3 flex-wrap">
                          <div className="bg-[#F5F3FF] p-2 rounded-lg">
                            <Receipt className="h-5 w-5 text-[#8B5CF6]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{expense.title}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-[#F5F3FF] text-[#8B5CF6] border-[#8B5CF6] border font-semibold">
                                {expense.category}
                              </Badge>
                              {expense.event && (
                                <Badge variant="outline" className="border-gray-300 text-gray-700 font-medium">
                                  {expense.event.name}
                                </Badge>
                              )}
                              {expense.receiptUrl ? (
                                <a
                                  href={expense.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-[#8B5CF6] hover:text-[#7C3AED] font-semibold bg-[#F5F3FF] px-2 py-1 rounded-full border border-[#8B5CF6]"
                                >
                                  <ImageIcon className="h-3 w-3" />
                                  View Bill
                                </a>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                                  <ImageIcon className="h-3 w-3" />
                                  No bill attached
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {expense.description && (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700 leading-relaxed">{expense.description}</p>
                          </div>
                        )}
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
                      <div className="flex flex-col items-end gap-4 md:min-w-[200px]">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Amount</p>
                          <p className="text-3xl font-bold text-[#8B5CF6]">{formatCurrency(Number(expense.amount))}</p>
                        </div>
                        <div className="flex gap-2 w-full">
                          <Button
                            onClick={() => handleApproveExpense(expense.id)}
                            disabled={processing === expense.id}
                            className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white shadow-lg h-11 font-semibold"
                          >
                            {processing === expense.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setRejectionDialog({
                                open: true,
                                id: expense.id,
                                title: expense.title,
                                type: "expense",
                              })
                            }
                            disabled={processing === expense.id}
                            className="flex-1 border-2 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] h-11 font-semibold"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <RejectionDialog
        open={rejectionDialog.open}
        onOpenChange={(open) => setRejectionDialog((d) => ({ ...d, open }))}
        onConfirm={handleReject}
        expenseTitle={rejectionDialog.title}
      />
    </div>
  );
}

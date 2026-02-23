import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Calendar, AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getCurrentMember } from "@/lib/auth/helpers";
import { db } from "@/db";
import { donations, expenses, events, members } from "@/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import type { FundSummary } from "@/types";

export default async function DashboardPage() {
  const { member } = await getCurrentMember();

  // Get fund summary (replacing RPC call)
  const [donationSummary] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${donations.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(donations)
    .where(eq(donations.clubId, member.clubId!));

  const [expenseSummary] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(expenses)
    .where(and(
      eq(expenses.clubId, member.clubId!),
      eq(expenses.status, 'approved')
    ));

  const [pendingExpenseSummary] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(and(
      eq(expenses.clubId, member.clubId!),
      eq(expenses.status, 'pending')
    ));

  const summary: FundSummary = {
    total_donations: Number(donationSummary?.total || 0),
    total_expenses: Number(expenseSummary?.total || 0),
    pending_expenses: Number(pendingExpenseSummary?.total || 0),
    balance: Number(donationSummary?.total || 0) - Number(expenseSummary?.total || 0),
    donation_count: Number(donationSummary?.count || 0),
    expense_count: Number(expenseSummary?.count || 0),
  };

  // Recent donations
  const recentDonations = await db
    .select()
    .from(donations)
    .where(eq(donations.clubId, member.clubId!))
    .orderBy(desc(donations.createdAt))
    .limit(5);

  // Recent expenses
  const recentExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.clubId, member.clubId!))
    .orderBy(desc(expenses.createdAt))
    .limit(5);

  // Active events with donations
  const activeEvents = await db.query.events.findMany({
    where: and(
      eq(events.clubId, member.clubId!),
      inArray(events.status, ['upcoming', 'active'])
    ),
    with: {
      donations: {
        columns: {
          amount: true,
        },
      },
    },
    orderBy: desc(events.createdAt),
    limit: 3,
  });

  // Pending expenses count
  const pendingCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(expenses)
    .where(and(
      eq(expenses.clubId, member.clubId!),
      eq(expenses.status, 'pending')
    ))
    .then(rows => Number(rows[0]?.count || 0));

  // Team count
  const teamCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(members)
    .where(and(
      eq(members.clubId, member.clubId!),
      eq(members.isActive, true)
    ))
    .then(rows => Number(rows[0]?.count || 0));

  const donationTransactions =
    recentDonations?.map((d) => ({
      id: d.id,
      type: "donation" as const,
      title: `${d.donorName} - General Fund`,
      amount: Number(d.amount),
      date: d.createdAt!,
    })) || [];

  const expenseTransactions =
    recentExpenses?.map((e) => ({
      id: e.id,
      type: "expense" as const,
      title: e.title,
      amount: Number(e.amount),
      date: e.createdAt!,
      status: e.status,
    })) || [];

  const transactions = [...donationTransactions, ...expenseTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const isAdmin = member?.role === "admin" || member?.role === "treasurer";
  const isCoordinator = member?.role === "coordinator";

  // Coordinator-specific stats
  let myTotalDonations = 0;
  let myTotalExpenses = 0;
  let myPendingExpenses = 0;
  let myDonationsCount = 0;
  let myExpensesCount = 0;

  if (isCoordinator) {
    const [myDonationStats] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${donations.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(donations)
      .where(eq(donations.collectedBy, member.id));

    const [myExpenseStats] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .where(eq(expenses.submittedBy, member.id));

    const [myPendingStats] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .where(and(
        eq(expenses.submittedBy, member.id),
        eq(expenses.status, 'pending')
      ));

    myTotalDonations = Number(myDonationStats?.total || 0);
    myTotalExpenses = Number(myExpenseStats?.total || 0);
    myPendingExpenses = Number(myPendingStats?.count || 0);
    myDonationsCount = Number(myDonationStats?.count || 0);
    myExpensesCount = Number(myExpenseStats?.count || 0);
  }

  const needsSetup = member.role === "admin" && !member.club?.upiId;

  return (
    <div className="space-y-6">
      {/* Setup Incomplete Banner */}
      {needsSetup && (
        <div className="flex items-center gap-4 bg-[#FFF3EE] border-2 border-[#FF6B35] rounded-xl px-5 py-4">
          <div className="p-2 bg-[#FF6B35] rounded-lg shrink-0">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">Complete your club setup</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Add your club name, UPI ID, and bank details so your team can start recording transactions.
            </p>
          </div>
          <Link href="/settings" className="shrink-0">
            <Button size="sm" className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-semibold shadow-md">
              Go to Settings
            </Button>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-gradient-to-br from-[#0066FF] to-[#0052CC] p-3 rounded-xl shadow-lg ring-4 ring-[#E6F2FF]">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1 font-medium text-sm sm:text-base">
              Welcome back, {member?.fullName || "Admin"}! 👋
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <Link href="/team">
              <Button variant="outline" className="border-2 border-[#0066FF] text-[#0066FF] hover:bg-[#E6F2FF] h-11 font-semibold">
                <Users className="mr-2 h-4 w-4" />
                Team
              </Button>
            </Link>
          )}
          <Link href="/donations/new">
            <Button className="bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-lg h-11 px-6 font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              Add Donation
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats for Admin */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2 border-[#0066FF] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Team Members</p>
                  <p className="text-3xl font-bold text-[#0066FF] mt-2">{teamCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Active members</p>
                </div>
                <div className="p-3 bg-[#E6F2FF] rounded-xl border-2 border-[#0066FF]/20">
                  <Users className="h-7 w-7 text-[#0066FF]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#10B981] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Events</p>
                  <p className="text-3xl font-bold text-[#10B981] mt-2">{activeEvents?.length || 0}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Ongoing campaigns</p>
                </div>
                <div className="p-3 bg-[#D1FAE5] rounded-xl border-2 border-[#10B981]/20">
                  <Calendar className="h-7 w-7 text-[#10B981]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#FF6B35] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Approvals</p>
                  <p className="text-3xl font-bold text-[#FF6B35] mt-2">{pendingCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Awaiting review</p>
                </div>
                <div className="p-3 bg-[#FFF3EE] rounded-xl border-2 border-[#FF6B35]/20">
                  <AlertCircle className="h-7 w-7 text-[#FF6B35]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Stats for Coordinator */}
      {isCoordinator && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2 border-[#10B981] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">My Donations</p>
                  <p className="text-3xl font-bold text-[#10B981] mt-2">
                    ₹{myTotalDonations.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{myDonationsCount} collected</p>
                </div>
                <div className="p-3 bg-[#D1FAE5] rounded-xl border-2 border-[#10B981]/20">
                  <TrendingUp className="h-7 w-7 text-[#10B981]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#8B5CF6] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">My Expenses</p>
                  <p className="text-3xl font-bold text-[#8B5CF6] mt-2">
                    ₹{myTotalExpenses.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{myExpensesCount} submitted</p>
                </div>
                <div className="p-3 bg-[#F5F3FF] rounded-xl border-2 border-[#8B5CF6]/20">
                  <AlertCircle className="h-7 w-7 text-[#8B5CF6]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#FF6B35] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Review</p>
                  <p className="text-3xl font-bold text-[#FF6B35] mt-2">{myPendingExpenses}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Awaiting approval</p>
                </div>
                <div className="p-3 bg-[#FFF3EE] rounded-xl border-2 border-[#FF6B35]/20">
                  <AlertCircle className="h-7 w-7 text-[#FF6B35]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <StatsCards summary={summary} />

      <div className="grid gap-6 md:grid-cols-2">
        {transactions.length > 0 ? (
          <RecentActivity transactions={transactions} />
        ) : (
          <Card className="shadow-lg border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="bg-[#E6F2FF] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-[#0066FF]" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-2">No transactions yet</p>
                <p className="text-xs text-gray-500 mb-6">Add your first donation</p>
                <Link href="/donations/new">
                  <Button className="bg-[#0066FF] hover:bg-[#0052CC] text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Donation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between border-b-2 border-gray-200 pb-4 bg-gradient-to-r from-[#D1FAE5] to-white">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Calendar className="h-5 w-5 text-[#10B981]" />
              </div>
              <CardTitle className="text-gray-900 font-bold">Active Campaigns</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {activeEvents && activeEvents.length > 0 ? (
              <div className="space-y-5">
                {activeEvents.map((event) => {
                  const raised = event.donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
                  const target = Number(event.targetAmount) || 1;
                  const percentage = Math.min(Math.round((raised / target) * 100), 100);

                  return (
                    <div key={event.id} className="space-y-3 p-5 bg-gradient-to-br from-[#D1FAE5] to-[#ECFEFF] rounded-xl border-2 border-[#10B981] shadow-md hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-gray-900">{event.name}</h4>
                        <div className="flex items-center gap-2">
                          <div className="bg-white px-3 py-1 rounded-full border-2 border-[#10B981]">
                            <span className="text-sm font-bold text-[#10B981]">{percentage}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-white rounded-full h-4 border-2 border-gray-200 shadow-inner overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#10B981] to-[#059669] h-full rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                          <span className="text-xs font-semibold text-gray-600">Raised: </span>
                          <span className="text-sm font-bold text-[#10B981]">₹{raised.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                          <span className="text-xs font-semibold text-gray-600">Target: </span>
                          <span className="text-sm font-bold text-gray-900">₹{target.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-[#D1FAE5] to-[#ECFEFF] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 ring-4 ring-[#D1FAE5]/50">
                  <Calendar className="h-10 w-10 text-[#10B981]" />
                </div>
                <p className="text-lg font-bold text-gray-900 mb-2">No active campaigns</p>
                <p className="text-sm text-gray-600">Create your first campaign to start fundraising</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use server";

import { db } from "@/db";
import { donations, expenses, events, members } from "@/db/schema";
import { requireRole } from "@/lib/auth/helpers";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

export async function getDonationsReport(filters?: {
  startDate?: string;
  endDate?: string;
  eventId?: string;
  paymentMode?: string;
}) {
  const member = await requireRole(["admin", "treasurer"]);

  let conditions = [eq(donations.clubId, member.clubId!)];

  if (filters?.startDate) {
    conditions.push(gte(donations.donationDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(donations.donationDate, filters.endDate));
  }
  if (filters?.eventId) {
    conditions.push(eq(donations.eventId, filters.eventId));
  }
  if (filters?.paymentMode) {
    conditions.push(eq(donations.paymentMode, filters.paymentMode as any));
  }

  const results = await db.query.donations.findMany({
    where: and(...conditions),
    with: {
      event: {
        columns: { name: true },
      },
      submitter: {
        columns: { fullName: true },
      },
    },
    orderBy: desc(donations.donationDate),
  });

  // Calculate summary
  const total = results.reduce((sum, d) => sum + Number(d.amount), 0);
  const count = results.length;

  return {
    data: results,
    summary: {
      total,
      count,
      average: count > 0 ? total / count : 0,
    },
  };
}

export async function getExpensesReport(filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  category?: string;
  eventId?: string;
}) {
  const member = await requireRole(["admin", "treasurer"]);

  let conditions = [eq(expenses.clubId, member.clubId!)];

  if (filters?.startDate) {
    conditions.push(gte(expenses.expenseDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(expenses.expenseDate, filters.endDate));
  }
  if (filters?.status) {
    conditions.push(eq(expenses.status, filters.status as any));
  }
  if (filters?.category) {
    conditions.push(eq(expenses.category, filters.category as any));
  }
  if (filters?.eventId) {
    conditions.push(eq(expenses.eventId, filters.eventId));
  }

  const results = await db.query.expenses.findMany({
    where: and(...conditions),
    with: {
      event: {
        columns: {
          name: true,
        },
      },
      submitter: {
        columns: {
          fullName: true,
        },
      },
      approver: {
        columns: {
          fullName: true,
        },
      },
    },
    orderBy: desc(expenses.expenseDate),
  });

  // Calculate summary
  const total = results.reduce((sum, e) => sum + Number(e.amount), 0);
  const approved = results.filter((e) => e.status === "approved");
  const pending = results.filter((e) => e.status === "pending");
  const rejected = results.filter((e) => e.status === "rejected");

  return {
    data: results,
    summary: {
      total,
      count: results.length,
      approved: approved.reduce((sum, e) => sum + Number(e.amount), 0),
      pending: pending.reduce((sum, e) => sum + Number(e.amount), 0),
      rejected: rejected.reduce((sum, e) => sum + Number(e.amount), 0),
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
    },
  };
}

export async function getEventsReport() {
  const member = await requireRole(["admin", "treasurer"]);

  const results = await db.query.events.findMany({
    where: eq(events.clubId, member.clubId!),
    orderBy: desc(events.createdAt),
  });

  // Get donations and expenses for each event
  const eventsWithStats = await Promise.all(
    results.map(async (event) => {
      const eventDonations = await db
        .select({
          total: sql<string>`COALESCE(SUM(${donations.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(donations)
        .where(eq(donations.eventId, event.id));

      const eventExpenses = await db
        .select({
          total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(expenses)
        .where(
          and(eq(expenses.eventId, event.id), eq(expenses.status, "approved")),
        );

      return {
        ...event,
        donationsTotal: Number(eventDonations[0]?.total || 0),
        donationsCount: eventDonations[0]?.count || 0,
        expensesTotal: Number(eventExpenses[0]?.total || 0),
        expensesCount: eventExpenses[0]?.count || 0,
        netAmount:
          Number(eventDonations[0]?.total || 0) -
          Number(eventExpenses[0]?.total || 0),
      };
    }),
  );

  const totalDonations = eventsWithStats.reduce(
    (sum, e) => sum + e.donationsTotal,
    0,
  );
  const totalExpenses = eventsWithStats.reduce(
    (sum, e) => sum + e.expensesTotal,
    0,
  );

  return {
    data: eventsWithStats,
    summary: {
      totalEvents: results.length,
      totalDonations,
      totalExpenses,
      netAmount: totalDonations - totalExpenses,
    },
  };
}

export async function getMembersReport() {
  const member = await requireRole(["admin", "treasurer"]);

  const results = await db.query.members.findMany({
    where: eq(members.clubId, member.clubId!),
    orderBy: desc(members.joinedAt),
  });

  // Get activity stats for each member
  const membersWithStats = await Promise.all(
    results.map(async (m) => {
      const donationsCollected = await db
        .select({
          total: sql<string>`COALESCE(SUM(${donations.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(donations)
        .where(eq(donations.collectedBy, m.id));

      const expensesSubmitted = await db
        .select({
          total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(expenses)
        .where(eq(expenses.submittedBy, m.id));

      const expensesApproved = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(expenses)
        .where(eq(expenses.approvedBy, m.id));

      return {
        ...m,
        donationsCollected: Number(donationsCollected[0]?.total || 0),
        donationsCount: donationsCollected[0]?.count || 0,
        expensesSubmitted: Number(expensesSubmitted[0]?.total || 0),
        expensesCount: expensesSubmitted[0]?.count || 0,
        approvalsCount: expensesApproved[0]?.count || 0,
      };
    }),
  );

  return {
    data: membersWithStats,
    summary: {
      totalMembers: results.length,
      activeMembers: results.filter((m) => m.isActive).length,
      inactiveMembers: results.filter((m) => !m.isActive).length,
    },
  };
}

export async function getFinancialSummary() {
  const member = await requireRole(["admin", "treasurer"]);

  const totalDonations = await db
    .select({
      total: sql<string>`COALESCE(SUM(${donations.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(donations)
    .where(eq(donations.clubId, member.clubId!));

  const totalExpenses = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(expenses)
    .where(
      and(eq(expenses.clubId, member.clubId!), eq(expenses.status, "approved")),
    );

  const pendingExpenses = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(expenses)
    .where(
      and(eq(expenses.clubId, member.clubId!), eq(expenses.status, "pending")),
    );

  return {
    totalDonations: Number(totalDonations[0]?.total || 0),
    donationsCount: totalDonations[0]?.count || 0,
    totalExpenses: Number(totalExpenses[0]?.total || 0),
    expensesCount: totalExpenses[0]?.count || 0,
    pendingExpenses: Number(pendingExpenses[0]?.total || 0),
    pendingCount: pendingExpenses[0]?.count || 0,
    netAmount:
      Number(totalDonations[0]?.total || 0) -
      Number(totalExpenses[0]?.total || 0),
  };
}

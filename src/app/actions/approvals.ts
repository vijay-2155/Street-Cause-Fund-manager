"use server";

import { db } from "@/db";
import { expenses, donations } from "@/db/schema";
import { getCurrentMember, requireRole } from "@/lib/auth/helpers";
import { eq, desc, and } from "drizzle-orm";

// ─── Expense Approvals ────────────────────────────────────────────────────────

export async function getPendingExpenses() {
  const member = await requireRole(["admin", "treasurer"]);

  const pending = await db.query.expenses.findMany({
    where: and(eq(expenses.clubId, member.clubId!), eq(expenses.status, "pending")),
    with: {
      event: {
        columns: { name: true },
      },
      submitter: {
        columns: { fullName: true },
      },
    },
    orderBy: desc(expenses.createdAt),
  });

  return pending;
}

export async function approveExpense(expenseId: string) {
  const member = await requireRole(["admin", "treasurer"]);

  await db
    .update(expenses)
    .set({
      status: "approved",
      approvedBy: member.id,
      approvedAt: new Date(),
    })
    .where(eq(expenses.id, expenseId));

  return { success: true };
}

export async function rejectExpense(expenseId: string, reason: string) {
  const member = await requireRole(["admin", "treasurer"]);

  await db
    .update(expenses)
    .set({
      status: "rejected",
      approvedBy: member.id,
      rejectionReason: reason,
    })
    .where(eq(expenses.id, expenseId));

  return { success: true };
}

// ─── Donation Approvals ───────────────────────────────────────────────────────

export async function getPendingDonations() {
  const member = await requireRole(["admin", "treasurer"]);

  const pending = await db.query.donations.findMany({
    where: and(eq(donations.clubId, member.clubId!), eq(donations.status, "pending")),
    with: {
      event: {
        columns: { name: true },
      },
      submitter: {
        columns: { fullName: true, role: true },
      },
    },
    orderBy: desc(donations.createdAt),
  });

  return pending;
}

export async function approveDonation(donationId: string) {
  const member = await requireRole(["admin", "treasurer"]);

  await db
    .update(donations)
    .set({
      status: "approved",
      reviewedBy: member.id,
      reviewedAt: new Date(),
      rejectionReason: null,
    })
    .where(eq(donations.id, donationId));

  return { success: true };
}

export async function rejectDonation(donationId: string, reason: string) {
  const member = await requireRole(["admin", "treasurer"]);

  await db
    .update(donations)
    .set({
      status: "rejected",
      reviewedBy: member.id,
      reviewedAt: new Date(),
      rejectionReason: reason,
    })
    .where(eq(donations.id, donationId));

  return { success: true };
}

// ─── Combined Pending Count (for sidebar badge) ───────────────────────────────

export async function getPendingCount(): Promise<number> {
  try {
    const { member } = await getCurrentMember();
    if (!["admin", "treasurer"].includes(member.role)) return 0;

    const [pendingExpenses, pendingDonations] = await Promise.all([
      db.query.expenses.findMany({
        where: and(eq(expenses.clubId, member.clubId!), eq(expenses.status, "pending")),
        columns: { id: true },
      }),
      db.query.donations.findMany({
        where: and(eq(donations.clubId, member.clubId!), eq(donations.status, "pending")),
        columns: { id: true },
      }),
    ]);

    return pendingExpenses.length + pendingDonations.length;
  } catch {
    return 0;
  }
}

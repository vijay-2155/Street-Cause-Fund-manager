"use server";

import { db } from "@/db";
import { expenses, events } from "@/db/schema";
import { getCurrentMember, requireAuth, requireRole } from "@/lib/auth/helpers";
import { eq, desc, and, or, inArray } from "drizzle-orm";

export async function getExpenses() {
  const { member } = await getCurrentMember();
  const isPrivileged = ["admin", "treasurer"].includes(member.role);

  // Privileged: see all. Coordinators: approved + own submissions
  const whereClause = isPrivileged
    ? eq(expenses.clubId, member.clubId!)
    : and(
        eq(expenses.clubId, member.clubId!),
        or(
          eq(expenses.status, "approved"),
          eq(expenses.submittedBy, member.id),
        ),
      );

  const allExpenses = await db.query.expenses.findMany({
    where: whereClause,
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

  return allExpenses;
}

export async function getEventsForSelect() {
  const { member } = await getCurrentMember();

  const activeEvents = await db
    .select({
      id: events.id,
      name: events.name,
    })
    .from(events)
    .where(
      and(
        eq(events.clubId, member.clubId!),
        or(eq(events.status, "upcoming"), eq(events.status, "active")),
      ),
    )
    .orderBy(events.name);

  return activeEvents;
}

export async function createExpense(formData: {
  title: string;
  description?: string;
  amount: string;
  category:
    | "food"
    | "supplies"
    | "transport"
    | "venue"
    | "printing"
    | "medical"
    | "donation_forward"
    | "other";
  receipt_url?: string;
  event_id?: string;
  expense_date: string;
}) {
  const member = await requireAuth();

  const amount = parseFloat(formData.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  const [newExpense] = await db
    .insert(expenses)
    .values({
      clubId: member.clubId!,
      eventId: formData.event_id || null,
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      amount: formData.amount,
      category: formData.category,
      receiptUrl: formData.receipt_url || null,
      status: "pending",
      submittedBy: member.id,
      expenseDate: formData.expense_date,
    })
    .returning();

  return newExpense;
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

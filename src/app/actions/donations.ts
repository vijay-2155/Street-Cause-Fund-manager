"use server";

import { db } from "@/db";
import { donations, events, members } from "@/db/schema";
import { getCurrentMember, requireAuth, requireRole } from "@/lib/auth/helpers";
import { eq, desc, and, or } from "drizzle-orm";

export async function getDonations() {
  const { member } = await getCurrentMember();
  const isPrivileged = ["admin", "treasurer"].includes(member.role);

  // Privileged: only approved. Others: approved + own submissions (any status)
  const whereClause = isPrivileged
    ? and(eq(donations.clubId, member.clubId!), eq(donations.status, "approved"))
    : and(
        eq(donations.clubId, member.clubId!),
        or(eq(donations.status, "approved"), eq(donations.collectedBy, member.id))
      );

  const allDonations = await db.query.donations.findMany({
    where: whereClause,
    with: {
      event: {
        columns: { name: true },
      },
      submitter: {
        columns: { fullName: true },
      },
    },
    orderBy: desc(donations.createdAt),
  });

  return allDonations;
}

export async function createDonation(formData: {
  donor_name: string;
  donor_email?: string;
  donor_phone?: string;
  amount: string;
  payment_mode: "upi" | "cash" | "bank_transfer" | "cheque" | "other";
  transaction_id?: string;
  screenshot_url?: string;
  notes?: string;
  event_id?: string;
  donation_date: string;
  blood_group?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "";
  can_contact_for_blood?: boolean;
}) {
  const member = await requireAuth();

  const amount = parseFloat(formData.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  // Admin/Treasurer donations are auto-approved; others go to pending
  const status: "pending" | "approved" = ["admin", "treasurer"].includes(member.role)
    ? "approved"
    : "pending";

  const [newDonation] = await db
    .insert(donations)
    .values({
      clubId: member.clubId!,
      eventId: formData.event_id || null,
      donorName: formData.donor_name.trim(),
      donorEmail: formData.donor_email?.trim() || null,
      donorPhone: formData.donor_phone?.trim() || null,
      amount: formData.amount,
      paymentMode: formData.payment_mode,
      transactionId: formData.transaction_id?.trim() || null,
      screenshotUrl: formData.screenshot_url || null,
      notes: formData.notes?.trim() || null,
      collectedBy: member.id,
      donationDate: formData.donation_date,
      bloodGroup: formData.blood_group || null,
      canContactForBlood: formData.can_contact_for_blood || false,
      status,
    })
    .returning();

  return { donation: newDonation, status };
}

export async function getCurrentUserRole() {
  const { member } = await getCurrentMember();
  return member.role as string;
}

export async function getCurrentMemberInfo() {
  const { member } = await getCurrentMember();
  return { role: member.role as string, memberId: member.id };
}

export async function updateDonation(
  id: string,
  formData: {
    donor_name: string;
    donor_email?: string;
    donor_phone?: string;
    amount: string;
    payment_mode: "upi" | "cash" | "bank_transfer" | "cheque" | "other";
    transaction_id?: string;
    screenshot_url?: string;
    notes?: string;
    event_id?: string;
    donation_date: string;
    blood_group?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "";
    can_contact_for_blood?: boolean;
  }
) {
  const member = await requireRole(["admin"]);

  const amount = parseFloat(formData.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  // Make sure donation belongs to the member's club
  const existing = await db.query.donations.findFirst({
    where: eq(donations.id, id),
  });

  if (!existing || existing.clubId !== member.clubId) {
    throw new Error("Donation not found");
  }

  const [updated] = await db
    .update(donations)
    .set({
      donorName: formData.donor_name.trim(),
      donorEmail: formData.donor_email?.trim() || null,
      donorPhone: formData.donor_phone?.trim() || null,
      amount: formData.amount,
      paymentMode: formData.payment_mode,
      transactionId: formData.transaction_id?.trim() || null,
      ...(formData.screenshot_url !== undefined && { screenshotUrl: formData.screenshot_url || null }),
      notes: formData.notes?.trim() || null,
      eventId: formData.event_id || null,
      donationDate: formData.donation_date,
      bloodGroup: formData.blood_group || null,
      canContactForBlood: formData.can_contact_for_blood || false,
      updatedAt: new Date(),
    })
    .where(eq(donations.id, id))
    .returning();

  return updated;
}

export async function resubmitDonation(id: string) {
  const member = await requireAuth();

  const existing = await db.query.donations.findFirst({
    where: eq(donations.id, id),
  });

  if (!existing) throw new Error("Donation not found");
  if (existing.collectedBy !== member.id) throw new Error("Unauthorized");
  if (existing.status !== "rejected") throw new Error("Only rejected donations can be resubmitted");

  await db
    .update(donations)
    .set({
      status: "pending",
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(donations.id, id));

  return { success: true };
}

export async function getEventsForSelect() {
  const { member } = await getCurrentMember();

  const activeEvents = await db.query.events.findMany({
    where: eq(events.clubId, member.clubId!),
    columns: {
      id: true,
      name: true,
    },
    orderBy: desc(events.createdAt),
  });

  return activeEvents;
}

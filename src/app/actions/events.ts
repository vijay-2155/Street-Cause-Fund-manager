"use server";

import { db } from "@/db";
import { events, donations } from "@/db/schema";
import { getCurrentMember, requireAuth, requireRole } from "@/lib/auth/helpers";
import { eq, desc } from "drizzle-orm";

export async function getEvents() {
  const { member } = await getCurrentMember();

  const allEvents = await db.query.events.findMany({
    where: eq(events.clubId, member.clubId!),
    with: {
      donations: {
        columns: {
          amount: true,
        },
      },
    },
    orderBy: desc(events.createdAt),
  });

  return allEvents;
}

export async function createEvent(formData: {
  name: string;
  description: string;
  target_amount: string;
  start_date: string;
  end_date: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
}) {
  const member = await requireRole(["admin", "treasurer"]);

  // Validate amount
  const amount = parseFloat(formData.target_amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid target amount");
  }

  const [newEvent] = await db
    .insert(events)
    .values({
      clubId: member.clubId!,
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      targetAmount: formData.target_amount,
      startDate: formData.start_date,
      endDate: formData.end_date,
      status: formData.status,
      createdBy: member.id,
    })
    .returning();

  return newEvent;
}

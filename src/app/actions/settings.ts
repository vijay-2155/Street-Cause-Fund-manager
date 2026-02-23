"use server";

import { db } from "@/db";
import { clubs, members } from "@/db/schema";
import { requireRole, getCurrentMember } from "@/lib/auth/helpers";
import { eq } from "drizzle-orm";

// Get club settings
export async function getClubSettings() {
  const { member } = await getCurrentMember();

  const club = await db.query.clubs.findFirst({
    where: eq(clubs.id, member.clubId!),
  });

  if (!club) {
    throw new Error("Club not found");
  }

  return club;
}

// Update club settings (admin only)
export async function updateClubSettings(data: {
  name: string;
  description?: string;
  logoUrl?: string;
  upiId?: string;
  bankDetails?: string;
}) {
  const member = await requireRole(["admin"]);

  const [updatedClub] = await db
    .update(clubs)
    .set({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      logoUrl: data.logoUrl?.trim() || null,
      upiId: data.upiId?.trim() || null,
      bankDetails: data.bankDetails?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(clubs.id, member.clubId!))
    .returning();

  return updatedClub;
}

// Get all members for management (admin only)
export async function getAllMembersForManagement() {
  const member = await requireRole(["admin"]);

  const allMembers = await db.query.members.findMany({
    where: eq(members.clubId, member.clubId!),
    orderBy: (members, { desc }) => [desc(members.joinedAt)],
  });

  return allMembers;
}

// Update member role (admin only)
export async function updateMemberRole(
  memberId: string,
  role: "admin" | "treasurer" | "coordinator",
) {
  const currentMember = await requireRole(["admin"]);

  // Prevent admin from demoting themselves
  if (memberId === currentMember.id) {
    throw new Error("You cannot change your own role");
  }

  await db
    .update(members)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(members.id, memberId));

  return { success: true };
}

// Toggle member active status (admin only)
export async function toggleMemberStatus(memberId: string, isActive: boolean) {
  const currentMember = await requireRole(["admin"]);

  // Prevent admin from deactivating themselves
  if (memberId === currentMember.id) {
    throw new Error("You cannot deactivate your own account");
  }

  await db
    .update(members)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(members.id, memberId));

  return { success: true };
}

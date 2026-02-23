"use server";

import { db } from "@/db";
import { members, memberInvites } from "@/db/schema";
import { getCurrentMember, requireRole } from "@/lib/auth/helpers";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function getTeamMembers() {
  const member = await requireRole(["admin", "treasurer"]);

  const teamMembers = await db.query.members.findMany({
    where: eq(members.clubId, member.clubId!),
    orderBy: (members, { desc }) => [desc(members.joinedAt)],
  });

  return { members: teamMembers, currentMember: member };
}

export async function inviteMember(email: string, role: string) {
  const member = await requireRole(["admin", "treasurer"]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw new Error("Invalid email address");

  const normalizedEmail = email.toLowerCase().trim();

  // Check if already a member
  const existingMember = await db.query.members.findFirst({
    where: eq(members.email, normalizedEmail),
  });
  if (existingMember) throw new Error("This email is already a member");

  // Check if invite already pending
  const existingInvite = await db.query.memberInvites.findFirst({
    where: eq(memberInvites.email, normalizedEmail),
  });
  if (existingInvite && !existingInvite.acceptedAt) {
    throw new Error("A pending invitation already exists for this email");
  }

  const token = crypto.randomUUID();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // ── 1. Store invite in DB for role assignment in /auth/callback ────────────
  await db.insert(memberInvites).values({
    email: normalizedEmail,
    role: role as "admin" | "treasurer" | "coordinator",
    invitedBy: member.id,
    inviteToken: token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // ── 2. Send Supabase invite email ──────────────────────────────────────────
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      redirectTo: `${appUrl}/auth/callback`,
      data: { role, roleLabel, invitedBy: member.fullName },
    },
  );

  if (error) {
    // Clean up the DB invite if Supabase invite fails
    await db.delete(memberInvites).where(eq(memberInvites.inviteToken, token));
    throw new Error(`Failed to send invitation: ${error.message}`);
  }

  return { success: true, email: normalizedEmail };
}

export async function getPublicInvite(token: string) {
  if (!token) return null;

  const invite = await db.query.memberInvites.findFirst({
    where: eq(memberInvites.inviteToken, token),
  });

  if (!invite) return null;
  if (invite.acceptedAt) return null;
  if (invite.expiresAt && new Date() > invite.expiresAt) return null;

  return {
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
  };
}

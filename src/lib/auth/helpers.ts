import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentMember(requireActive: boolean = true) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  // Primary lookup by Supabase auth ID
  let member = await db.query.members.findFirst({
    where: eq(members.authId, user.id),
    with: { club: true },
  });

  if (!member) {
    // Auto-link: member pre-created by email (setup admin) but no authId yet
    const byEmail = await db.query.members.findFirst({
      where: eq(members.email, user.email!),
    });

    if (byEmail && !byEmail.authId) {
      await db
        .update(members)
        .set({ authId: user.id, updatedAt: new Date() })
        .where(eq(members.email, user.email!));

      member = await db.query.members.findFirst({
        where: eq(members.authId, user.id),
        with: { club: true },
      });
    }
  }

  if (!member) {
    throw new Error("Member profile not found. Please contact an administrator.");
  }

  if (requireActive && !member.isActive) {
    throw new Error("Your account is currently inactive. Please contact an administrator.");
  }

  return { user, member };
}

export async function getCurrentMemberSafe(
  requireActive: boolean = true
): Promise<{ user: any; member: any } | null> {
  try {
    return await getCurrentMember(requireActive);
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const result = await getCurrentMember();
  return result.member;
}

export async function requireRole(allowedRoles: string[]) {
  const { member } = await getCurrentMember();
  // Admin bypasses all role checks
  if (member.role === "admin") return member;
  if (!allowedRoles.includes(member.role)) {
    throw new Error(`Forbidden: Requires role: ${allowedRoles.join(" or ")}`);
  }
  return member;
}

export function hasRole(memberRole: string, allowedRoles: string[]): boolean {
  if (memberRole === "admin") return true;
  return allowedRoles.includes(memberRole);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "").slice(0, 500);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function isValidAmount(amount: number): boolean {
  return !isNaN(amount) && amount > 0 && amount <= 10000000;
}

export function formatError(error: any): string {
  if (error.code === "23505") return "This record already exists";
  if (error.code === "23503") return "Referenced record not found";
  if (error.code === "42501") return "Permission denied";
  if (error.code === "PGRST116") return "No data found";
  return error.message || "An unexpected error occurred";
}

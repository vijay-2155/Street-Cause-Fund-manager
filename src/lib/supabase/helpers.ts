import { createClient } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get current authenticated member with club info
 * @param requireActive - If true, only return active members (default: true)
 */
export async function getCurrentMember(
  supabase: SupabaseClient,
  requireActive: boolean = true
) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  let query = supabase
    .from("members")
    .select("*, club:clubs(*)")
    .eq("auth_id", user.id);

  if (requireActive) {
    query = query.eq("is_active", true);
  }

  const { data: member, error: memberError } = await query.maybeSingle();

  if (memberError) {
    console.error("Member fetch error:", memberError);
    console.error("User ID:", user.id);
    console.error("User email:", user.email);
    throw new Error(
      `Database error: ${memberError.message || JSON.stringify(memberError) || "Unknown error"}`
    );
  }

  if (!member) {
    console.log("No member found for user:", user.id, user.email);

    // Check if member exists but is inactive
    const { data: inactiveMember, error: checkError } = await supabase
      .from("members")
      .select("is_active, email, role")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking inactive member:", checkError);
    }

    if (inactiveMember && !inactiveMember.is_active) {
      throw new Error("Your account is currently inactive. Please contact an administrator.");
    }

    // Check if member exists with email but no auth_id
    const { data: memberByEmail } = await supabase
      .from("members")
      .select("id, email, auth_id, is_active")
      .eq("email", user.email!)
      .maybeSingle();

    if (memberByEmail) {
      if (!memberByEmail.auth_id) {
        throw new Error(
          "Account exists but not linked. Please run FIX_AUTH_LINKING.sql in Supabase SQL Editor."
        );
      }
      if (!memberByEmail.is_active) {
        throw new Error("Your account is currently inactive. Please contact an administrator.");
      }
    }

    throw new Error(
      "Member profile not found. Please ensure you've run the seed script and auth trigger setup."
    );
  }

  return { user, member };
}

/**
 * Check if current member has required role
 */
export function hasRole(memberRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(memberRole);
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove < and >
    .slice(0, 500); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Indian phone number
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Validate amount (must be positive number)
 */
export function isValidAmount(amount: number): boolean {
  return !isNaN(amount) && amount > 0 && amount <= 10000000; // Max 1 crore
}

/**
 * Format error message for user display
 */
export function formatError(error: any): string {
  if (error.code === "23505") {
    return "This record already exists";
  }
  if (error.code === "23503") {
    return "Referenced record not found";
  }
  if (error.code === "42501") {
    return "Permission denied";
  }
  if (error.code === "PGRST116") {
    return "No data found";
  }
  return error.message || "An unexpected error occurred";
}

/**
 * Safe wrapper for getCurrentMember that handles errors gracefully
 * Returns null if member not found instead of throwing
 */
export async function getCurrentMemberSafe(
  supabase: SupabaseClient,
  requireActive: boolean = true
): Promise<{ user: any; member: any } | null> {
  try {
    return await getCurrentMember(supabase, requireActive);
  } catch (error) {
    console.error("getCurrentMember error:", error);
    return null;
  }
}

/**
 * Check if user is authenticated (has valid session)
 */
export async function isAuthenticated(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clubs, members } from "@/db/schema";
import { count } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { secret, email, fullName } = await req.json();

    // ── 1. Validate setup secret ──────────────────────────────────────────────
    const setupSecret = process.env.SETUP_SECRET;
    if (!setupSecret) {
      return NextResponse.json(
        { error: "SETUP_SECRET is not configured in environment variables." },
        { status: 500 }
      );
    }
    if (secret !== setupSecret) {
      return NextResponse.json({ error: "Invalid setup secret." }, { status: 401 });
    }

    // ── 2. Validate inputs ────────────────────────────────────────────────────
    if (!email?.trim() || !fullName?.trim()) {
      return NextResponse.json({ error: "Email and full name are required." }, { status: 400 });
    }

    // ── 3. One-time only: block if members already exist ─────────────────────
    const [{ total }] = await db.select({ total: count() }).from(members);
    if (Number(total) > 0) {
      return NextResponse.json(
        { error: "Setup already completed. An admin account already exists." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedName = fullName.trim();

    // ── 4. Create club if none exists ─────────────────────────────────────────
    let [club] = await db.select().from(clubs).limit(1);
    if (!club) {
      [club] = await db
        .insert(clubs)
        .values({ name: "Street Cause", description: "Community fund management" })
        .returning();
    }

    // ── 5. Pre-create admin member in DB (no authId yet) ─────────────────────
    //   The /auth/callback will link authId when they sign in with Google.
    await db.insert(members).values({
      clubId: club.id,
      fullName: trimmedName,
      email: trimmedEmail,
      role: "admin",
      isActive: true,
    });

    // ── 6. Send Supabase invite email ─────────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const supabaseAdmin = getSupabaseAdmin();
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(trimmedEmail, {
      redirectTo: `${appUrl}/auth/callback`,
      data: { role: "admin", roleLabel: "Admin", invitedBy: "Setup" },
    });

    if (inviteError) {
      console.error("Supabase invite error:", inviteError);
      // Don't fail setup — member is created in DB, they can still sign in via Google
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

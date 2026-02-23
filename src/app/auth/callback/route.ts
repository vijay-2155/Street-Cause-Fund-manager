import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { members, clubs, memberInvites } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error("Auth callback error:", exchangeError);
    return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(exchangeError.message)}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/sign-in`);
  }

  // Capture Google refresh token (only present right after OAuth, requires offline access)
  const googleRefreshToken = sessionData?.session?.provider_refresh_token ?? null;

  const userEmail = user.email!;
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split("@")[0];
  const avatarUrl = user.user_metadata?.avatar_url || null;

  try {
    // ── Case 1: Member already exists with this authId ─────────────────────────
    const existingByAuthId = await db.query.members.findFirst({
      where: eq(members.authId, user.id),
    });
    if (existingByAuthId) {
      if (googleRefreshToken) {
        await db.update(members).set({ googleRefreshToken, updatedAt: new Date() }).where(eq(members.authId, user.id));
      }
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    // ── Case 2: Pre-created member by email (no authId yet) ────────────────────
    const existingByEmail = await db.query.members.findFirst({
      where: eq(members.email, userEmail),
    });
    if (existingByEmail && !existingByEmail.authId) {
      await db
        .update(members)
        .set({
          authId: user.id,
          fullName: existingByEmail.fullName || fullName,
          avatarUrl: avatarUrl || existingByEmail.avatarUrl,
          ...(googleRefreshToken ? { googleRefreshToken } : {}),
          updatedAt: new Date(),
        })
        .where(eq(members.email, userEmail));
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    // ── Get or create club ─────────────────────────────────────────────────────
    let [club] = await db.select().from(clubs).limit(1);
    if (!club) {
      [club] = await db
        .insert(clubs)
        .values({ name: "Street Cause", description: "Community fund management" })
        .returning();
    }

    // ── Case 3: Pending invite for this email ──────────────────────────────────
    const pendingInvite = await db.query.memberInvites.findFirst({
      where: eq(memberInvites.email, userEmail),
    });

    if (
      pendingInvite &&
      !pendingInvite.acceptedAt &&
      (!pendingInvite.expiresAt || new Date() <= pendingInvite.expiresAt)
    ) {
      await db.insert(members).values({
        authId: user.id,
        clubId: club.id,
        fullName,
        email: userEmail,
        avatarUrl,
        role: pendingInvite.role,
        isActive: true,
        ...(googleRefreshToken ? { googleRefreshToken } : {}),
      });
      await db
        .update(memberInvites)
        .set({ acceptedAt: new Date() })
        .where(eq(memberInvites.id, pendingInvite.id));
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    // ── Case 4: First user ever → bootstrap admin ──────────────────────────────
    const [{ total }] = await db.select({ total: count() }).from(members);
    if (Number(total) === 0) {
      await db.insert(members).values({
        authId: user.id,
        clubId: club.id,
        fullName,
        email: userEmail,
        avatarUrl,
        role: "admin",
        isActive: true,
        ...(googleRefreshToken ? { googleRefreshToken } : {}),
      });
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    // ── Not invited ────────────────────────────────────────────────────────────
    return NextResponse.redirect(`${origin}/unauthorized`);
  } catch (err) {
    console.error("Auth callback member creation error:", err);
    return NextResponse.redirect(`${origin}/sign-in?error=setup_failed`);
  }
}

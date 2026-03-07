import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clubs } from "@/db/schema";
import { syncAllActiveConfigs } from "@/app/actions/registrations";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allClubs = await db.select({ id: clubs.id }).from(clubs);

    const results = [];
    for (const club of allClubs) {
      const result = await syncAllActiveConfigs(club.id);
      results.push({ clubId: club.id, ...result });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (e: any) {
    console.error("Cron sync error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

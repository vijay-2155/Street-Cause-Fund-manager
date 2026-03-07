"use server";

import { db } from "@/db";
import {
  registrationConfigs,
  eventRegistrations,
  members,
} from "@/db/schema";
import { requireRole } from "@/lib/auth/helpers";
import { eq, and, desc, count, sum, inArray } from "drizzle-orm";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import {
  refreshGoogleAccessToken,
  getSheetRows,
  downloadDriveFile,
  extractDriveFileId,
  normalizeGender,
  normalizeCategory,
  ticketAmountForCategory,
  splitNameAge,
  FORM_COLUMNS,
} from "@/lib/google-api";

// ─── Config Management ────────────────────────────────────────────────────────

export async function getRegistrationConfigs() {
  const member = await requireRole(["admin", "treasurer"]);

  return db.query.registrationConfigs.findMany({
    where: eq(registrationConfigs.clubId, member.clubId!),
    with: {
      event: { columns: { name: true } },
      registrations: { columns: { id: true } },
    },
    orderBy: desc(registrationConfigs.createdAt),
  });
}

export async function createRegistrationConfig(data: {
  configName: string;
  googleSheetId: string;
  sheetName: string;
  eventId?: string;
}) {
  const member = await requireRole(["admin", "treasurer"]);

  const sheetId = extractSheetId(data.googleSheetId);

  const [config] = await db
    .insert(registrationConfigs)
    .values({
      clubId: member.clubId!,
      eventId: data.eventId || null,
      configName: data.configName.trim(),
      googleSheetId: sheetId,
      sheetName: data.sheetName.trim() || "Form Responses 1",
      createdBy: member.id,
    })
    .returning();

  return config;
}

export async function updateRegistrationConfig(
  id: string,
  data: { configName: string; sheetName: string; isActive: boolean }
) {
  const member = await requireRole(["admin", "treasurer"]);

  await db
    .update(registrationConfigs)
    .set({
      configName: data.configName.trim(),
      sheetName: data.sheetName.trim(),
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(registrationConfigs.id, id),
        eq(registrationConfigs.clubId, member.clubId!)
      )
    );
}

/** Extract the sheet ID from a full Google Sheets URL or bare ID */
function extractSheetId(input: string): string {
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : input.trim();
}

// ─── Registrations CRUD ───────────────────────────────────────────────────────

export async function getRegistrations(filters?: {
  configId?: string;
  status?: "pending" | "approved" | "rejected";
}) {
  const member = await requireRole(["admin", "treasurer"]);

  const conditions = [eq(eventRegistrations.clubId, member.clubId!)];
  if (filters?.configId) {
    conditions.push(eq(eventRegistrations.configId, filters.configId));
  }
  if (filters?.status) {
    conditions.push(eq(eventRegistrations.status, filters.status));
  }

  return db.query.eventRegistrations.findMany({
    where: and(...conditions),
    with: {
      config: { columns: { configName: true, eventId: true } },
      reviewer: { columns: { fullName: true } },
    },
    orderBy: desc(eventRegistrations.importedAt),
  });
}

export async function getRegistrationStats(configId?: string) {
  const member = await requireRole(["admin", "treasurer"]);

  const conditions = [eq(eventRegistrations.clubId, member.clubId!)];
  if (configId) conditions.push(eq(eventRegistrations.configId, configId));

  const all = await db.query.eventRegistrations.findMany({
    where: and(...conditions),
    columns: { status: true, ticketAmount: true },
  });

  const total = all.length;
  const pending = all.filter((r) => r.status === "pending").length;
  const approved = all.filter((r) => r.status === "approved").length;
  const rejected = all.filter((r) => r.status === "rejected").length;
  const revenue = all
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + Number(r.ticketAmount), 0);

  return { total, pending, approved, rejected, revenue };
}

export async function approveRegistration(id: string) {
  const member = await requireRole(["admin", "treasurer"]);

  await db
    .update(eventRegistrations)
    .set({
      status: "approved",
      reviewedBy: member.id,
      reviewedAt: new Date(),
      rejectionReason: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(eventRegistrations.id, id),
        eq(eventRegistrations.clubId, member.clubId!)
      )
    );

  return { success: true };
}

export async function rejectRegistration(id: string, reason: string) {
  const member = await requireRole(["admin", "treasurer"]);

  await db
    .update(eventRegistrations)
    .set({
      status: "rejected",
      reviewedBy: member.id,
      reviewedAt: new Date(),
      rejectionReason: reason.trim(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(eventRegistrations.id, id),
        eq(eventRegistrations.clubId, member.clubId!)
      )
    );

  return { success: true };
}

// ─── Sync Engine ──────────────────────────────────────────────────────────────

/**
 * Sync a single registration config.
 * Returns { imported, skipped, errors }
 */
export async function syncRegistrations(configId: string): Promise<{
  imported: number;
  skipped: number;
  errors: string[];
}> {
  const member = await requireRole(["admin", "treasurer"]);

  // Load config
  const config = await db.query.registrationConfigs.findFirst({
    where: and(
      eq(registrationConfigs.id, configId),
      eq(registrationConfigs.clubId, member.clubId!)
    ),
  });
  if (!config) throw new Error("Registration config not found");
  if (!config.isActive) throw new Error("This configuration is inactive");

  // Get the admin/treasurer's Google refresh token
  const actor = await db.query.members.findFirst({
    where: eq(members.id, member.id),
    columns: { googleRefreshToken: true },
  });
  if (!actor?.googleRefreshToken) {
    throw new Error(
      "No Google credentials found. Please sign out and sign in again with Google to grant access."
    );
  }

  // Get fresh access token
  let accessToken: string;
  try {
    accessToken = await refreshGoogleAccessToken(actor.googleRefreshToken);
  } catch (e: any) {
    throw new Error(`Google auth failed: ${e.message}`);
  }

  // Fetch new rows from the sheet
  let rows: string[][];
  try {
    rows = await getSheetRows(
      accessToken,
      config.googleSheetId,
      config.sheetName,
      config.lastSyncedRow
    );
  } catch (e: any) {
    throw new Error(`Failed to read sheet: ${e.message}`);
  }

  if (rows.length === 0) {
    return { imported: 0, skipped: 0, errors: [] };
  }

  // Supabase admin client for server-side storage upload
  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = config.lastSyncedRow + i + 1; // 1-based data row index

    try {
      const rawName = row[FORM_COLUMNS.PARTICIPANT_NAME_AGE] || "";
      if (!rawName.trim()) {
        skipped++;
        continue;
      }

      const { name: participantName, age: participantAge } = splitNameAge(rawName);
      const rawP2 = row[FORM_COLUMNS.PARTICIPANT2_NAME_AGE] || "";
      const isP2NA = rawP2.trim().toLowerCase() === "na" || rawP2.trim() === "";
      const { name: participant2Name, age: participant2Age } = isP2NA
        ? { name: "", age: "" }
        : splitNameAge(rawP2);

      const category = normalizeCategory(row[FORM_COLUMNS.CATEGORY] || "");
      const gender = normalizeGender(row[FORM_COLUMNS.GENDER] || "");
      const ticketAmount = ticketAmountForCategory(category);

      const driveUrl = row[FORM_COLUMNS.SCREENSHOT_URL] || "";
      let screenshotUrl: string | null = null;

      // Download screenshot from Drive and re-upload to Supabase
      if (driveUrl) {
        const fileId = extractDriveFileId(driveUrl);
        if (fileId) {
          try {
            const file = await downloadDriveFile(accessToken, fileId);
            if (file) {
              const filename = `registrations/${config.id}/${rowIndex}-${Date.now()}.${file.extension}`;
              const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from("screenshots")
                .upload(filename, file.buffer, {
                  contentType: file.mimeType,
                  upsert: false,
                });
              if (!uploadError && uploadData) {
                const { data: { publicUrl } } = supabaseAdmin.storage
                  .from("screenshots")
                  .getPublicUrl(uploadData.path);
                screenshotUrl = publicUrl;
              }
            }
          } catch (screenshotErr: any) {
            // Screenshot download failure is non-fatal — store Drive URL as fallback
            errors.push(`Row ${rowIndex} screenshot: ${screenshotErr.message}`);
          }
        }
      }

      await db.insert(eventRegistrations).values({
        clubId: member.clubId!,
        configId: config.id,
        googleFormRowIndex: rowIndex,
        respondentEmail: row[FORM_COLUMNS.EMAIL] || null,
        participantName,
        participantAge: participantAge || null,
        contactNumber: row[FORM_COLUMNS.CONTACT] || null,
        gender: gender || null,
        category: category || null,
        participant2Name: participant2Name || null,
        participant2Age: participant2Age || null,
        transactionId: row[FORM_COLUMNS.TRANSACTION_ID] || null,
        screenshotDriveUrl: driveUrl || null,
        screenshotUrl,
        ticketAmount: String(ticketAmount),
        status: "pending",
      });

      imported++;
    } catch (e: any) {
      errors.push(`Row ${rowIndex}: ${e.message}`);
    }
  }

  // Update lastSyncedRow
  await db
    .update(registrationConfigs)
    .set({
      lastSyncedRow: config.lastSyncedRow + rows.length,
      updatedAt: new Date(),
    })
    .where(eq(registrationConfigs.id, config.id));

  return { imported, skipped, errors };
}

/**
 * Sync all active configs for the current member's club.
 * Used by the cron job.
 */
export async function syncAllActiveConfigs(clubId: string): Promise<{
  configsSynced: number;
  totalImported: number;
  errors: string[];
}> {
  const activeConfigs = await db.query.registrationConfigs.findMany({
    where: and(
      eq(registrationConfigs.clubId, clubId),
      eq(registrationConfigs.isActive, true)
    ),
    with: {
      createdByMember: { columns: { googleRefreshToken: true } },
    },
  });

  let configsSynced = 0;
  let totalImported = 0;
  const errors: string[] = [];

  for (const config of activeConfigs) {
    const refreshToken = (config as any).createdByMember?.googleRefreshToken;
    if (!refreshToken) {
      errors.push(`Config "${config.configName}": No Google credentials`);
      continue;
    }

    try {
      let accessToken: string;
      try {
        accessToken = await refreshGoogleAccessToken(refreshToken);
      } catch (e: any) {
        errors.push(`Config "${config.configName}": Token refresh failed — ${e.message}`);
        continue;
      }

      const rows = await getSheetRows(
        accessToken,
        config.googleSheetId,
        config.sheetName,
        config.lastSyncedRow
      );

      if (rows.length === 0) {
        configsSynced++;
        continue;
      }

      const supabaseAdmin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      let imported = 0;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIndex = config.lastSyncedRow + i + 1;
        try {
          const rawName = row[FORM_COLUMNS.PARTICIPANT_NAME_AGE] || "";
          if (!rawName.trim()) continue;

          const { name: participantName, age: participantAge } = splitNameAge(rawName);
          const rawP2 = row[FORM_COLUMNS.PARTICIPANT2_NAME_AGE] || "";
          const isP2NA = rawP2.trim().toLowerCase() === "na" || rawP2.trim() === "";
          const { name: participant2Name, age: participant2Age } = isP2NA
            ? { name: "", age: "" }
            : splitNameAge(rawP2);

          const category = normalizeCategory(row[FORM_COLUMNS.CATEGORY] || "");
          const gender = normalizeGender(row[FORM_COLUMNS.GENDER] || "");
          const ticketAmount = ticketAmountForCategory(category);
          const driveUrl = row[FORM_COLUMNS.SCREENSHOT_URL] || "";
          let screenshotUrl: string | null = null;

          if (driveUrl) {
            const fileId = extractDriveFileId(driveUrl);
            if (fileId) {
              try {
                const file = await downloadDriveFile(accessToken, fileId);
                if (file) {
                  const filename = `registrations/${config.id}/${rowIndex}-${Date.now()}.${file.extension}`;
                  const { data: uploadData } = await supabaseAdmin.storage
                    .from("screenshots")
                    .upload(filename, file.buffer, {
                      contentType: file.mimeType,
                      upsert: false,
                    });
                  if (uploadData) {
                    const { data: { publicUrl } } = supabaseAdmin.storage
                      .from("screenshots")
                      .getPublicUrl(uploadData.path);
                    screenshotUrl = publicUrl;
                  }
                }
              } catch (screenshotErr: any) {
                errors.push(`Config "${config.configName}" row ${rowIndex} screenshot: ${screenshotErr.message}`);
              }
            }
          }

          await db.insert(eventRegistrations).values({
            clubId: config.clubId!,
            configId: config.id,
            googleFormRowIndex: rowIndex,
            respondentEmail: row[FORM_COLUMNS.EMAIL] || null,
            participantName,
            participantAge: participantAge || null,
            contactNumber: row[FORM_COLUMNS.CONTACT] || null,
            gender: gender || null,
            category: category || null,
            participant2Name: participant2Name || null,
            participant2Age: participant2Age || null,
            transactionId: row[FORM_COLUMNS.TRANSACTION_ID] || null,
            screenshotDriveUrl: driveUrl || null,
            screenshotUrl,
            ticketAmount: String(ticketAmount),
            status: "pending",
          });
          imported++;
        } catch (e: any) {
          errors.push(`Config "${config.configName}" row ${rowIndex}: ${e.message}`);
        }
      }

      await db
        .update(registrationConfigs)
        .set({
          lastSyncedRow: config.lastSyncedRow + rows.length,
          updatedAt: new Date(),
        })
        .where(eq(registrationConfigs.id, config.id));

      totalImported += imported;
      configsSynced++;
    } catch (e: any) {
      errors.push(`Config "${config.configName}": ${e.message}`);
    }
  }

  return { configsSynced, totalImported, errors };
}

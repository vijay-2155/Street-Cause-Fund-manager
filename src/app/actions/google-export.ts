"use server";

import { google } from "googleapis";
import { requireRole } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDonationsReport, getExpensesReport } from "./reports";
import { getClubSettings } from "./settings";

// ─── Auth Helper ──────────────────────────────────────────────────────────────

async function getGoogleSheetsClient() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  let accessToken = session?.provider_token ?? null;

  if (!accessToken) {
    const member = await db.query.members.findFirst({
      where: eq(members.authId, user.id),
      columns: { googleRefreshToken: true },
    });

    if (!member?.googleRefreshToken) {
      throw new Error(
        "Google Sheets access requires re-authentication. Please sign out and sign back in.",
      );
    }

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
    );
    oauth2.setCredentials({ refresh_token: member.googleRefreshToken });
    const { credentials } = await oauth2.refreshAccessToken();
    accessToken = credentials.access_token ?? null;

    if (!accessToken) {
      throw new Error(
        "Failed to refresh Google token. Please sign out and sign back in.",
      );
    }
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  return {
    sheets: google.sheets({ version: "v4", auth: oauth2Client }),
  };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmtAmt(val: any) {
  const n = Number(val || 0);
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtDate(val: any) {
  if (!val) return "";
  try {
    return new Date(val).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(val);
  }
}

function capitalize(str: string) {
  return str
    ? str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const BRAND_BLUE = { red: 0, green: 0.4, blue: 1 }; // #0066FF
const BRAND_BLUE_LIGHT = { red: 0.9, green: 0.95, blue: 1 }; // #E6F2FF
const WHITE = { red: 1, green: 1, blue: 1 };
const DARK = { red: 0.1, green: 0.1, blue: 0.12 };
const GRAY_BG = { red: 0.965, green: 0.969, blue: 0.976 }; // #F7F8F9
const BORDER_LIGHT = { red: 0.88, green: 0.89, blue: 0.9 };
const GREEN = { red: 0.063, green: 0.725, blue: 0.506 }; // #10B981
const GREEN_BG = { red: 0.82, green: 0.98, blue: 0.89 }; // #D1FAE5

// ─── Spreadsheet Styling Helpers ──────────────────────────────────────────────

function solidBorder(color = BORDER_LIGHT): any {
  return { style: "SOLID", width: 1, color };
}

function buildStylingRequests(
  sheetId: number,
  headerRow: number,
  dataRows: number,
  colCount: number,
) {
  const requests: any[] = [];
  const dataStart = headerRow + 1;
  const dataEnd = dataStart + dataRows;

  // 1. Freeze header rows (title + column headers)
  requests.push({
    updateSheetProperties: {
      properties: { sheetId, gridProperties: { frozenRowCount: dataStart } },
      fields: "gridProperties.frozenRowCount",
    },
  });

  // 2. Title banner row — brand blue background, white bold text, merged
  requests.push({
    mergeCells: {
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: colCount,
      },
      mergeType: "MERGE_ALL",
    },
  });
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: colCount,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: BRAND_BLUE,
          textFormat: {
            bold: true,
            fontSize: 13,
            foregroundColor: WHITE,
            fontFamily: "Inter",
          },
          horizontalAlignment: "LEFT",
          verticalAlignment: "MIDDLE",
          padding: { left: 12 },
        },
      },
      fields:
        "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)",
    },
  });

  // 3. Sub-info row (row 1) — light blue background
  requests.push({
    mergeCells: {
      range: {
        sheetId,
        startRowIndex: 1,
        endRowIndex: 2,
        startColumnIndex: 0,
        endColumnIndex: colCount,
      },
      mergeType: "MERGE_ALL",
    },
  });
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 1,
        endRowIndex: 2,
        startColumnIndex: 0,
        endColumnIndex: colCount,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: BRAND_BLUE_LIGHT,
          textFormat: {
            fontSize: 9,
            foregroundColor: BRAND_BLUE,
            fontFamily: "Inter",
          },
          horizontalAlignment: "LEFT",
          verticalAlignment: "MIDDLE",
          padding: { left: 12 },
        },
      },
      fields:
        "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)",
    },
  });

  // 4. Column header row — dark background, white bold
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: headerRow,
        endRowIndex: dataStart,
        startColumnIndex: 0,
        endColumnIndex: colCount,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: DARK,
          textFormat: {
            bold: true,
            fontSize: 10,
            foregroundColor: WHITE,
            fontFamily: "Inter",
          },
          horizontalAlignment: "LEFT",
          verticalAlignment: "MIDDLE",
          wrapStrategy: "WRAP",
        },
      },
      fields:
        "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)",
    },
  });

  // 5. Alternating row colors for data rows
  if (dataRows > 0) {
    requests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [
            {
              sheetId,
              startRowIndex: dataStart,
              endRowIndex: dataEnd,
              startColumnIndex: 0,
              endColumnIndex: colCount,
            },
          ],
          booleanRule: {
            condition: {
              type: "CUSTOM_FORMULA",
              values: [{ userEnteredValue: "=ISEVEN(ROW())" }],
            },
            format: { backgroundColor: GRAY_BG },
          },
        },
        index: 0,
      },
    });
  }

  // 6. Totals row — green highlight
  if (dataRows > 0) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: dataEnd,
          endRowIndex: dataEnd + 1,
          startColumnIndex: 0,
          endColumnIndex: colCount,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: GREEN_BG,
            textFormat: {
              bold: true,
              fontSize: 11,
              foregroundColor: { red: 0.05, green: 0.35, blue: 0.25 },
              fontFamily: "Inter",
            },
            horizontalAlignment: "LEFT",
            verticalAlignment: "MIDDLE",
          },
        },
        fields:
          "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)",
      },
    });
  }

  // 7. Borders around entire data region (header → totals)
  const totalEnd = dataRows > 0 ? dataEnd + 1 : dataEnd;
  requests.push({
    updateBorders: {
      range: {
        sheetId,
        startRowIndex: headerRow,
        endRowIndex: totalEnd,
        startColumnIndex: 0,
        endColumnIndex: colCount,
      },
      top: solidBorder(DARK),
      bottom: solidBorder(DARK),
      left: solidBorder(),
      right: solidBorder(),
      innerHorizontal: solidBorder(),
      innerVertical: solidBorder(),
    },
  });

  // 8. Row height — title taller, data compact
  requests.push({
    updateDimensionProperties: {
      range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
      properties: { pixelSize: 42 },
      fields: "pixelSize",
    },
  });
  requests.push({
    updateDimensionProperties: {
      range: { sheetId, dimension: "ROWS", startIndex: 1, endIndex: 2 },
      properties: { pixelSize: 24 },
      fields: "pixelSize",
    },
  });
  if (dataRows > 0) {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: dataStart,
          endIndex: totalEnd,
        },
        properties: { pixelSize: 28 },
        fields: "pixelSize",
      },
    });
  }

  // 9. Auto-resize columns
  requests.push({
    autoResizeDimensions: {
      dimensions: {
        sheetId,
        dimension: "COLUMNS",
        startIndex: 0,
        endIndex: colCount,
      },
    },
  });

  return requests;
}

// ─── Print Settings ───────────────────────────────────────────────────────────

function printSettingsRequest(sheetId: number) {
  return {
    updateSheetProperties: {
      properties: {
        sheetId,
        gridProperties: { frozenRowCount: 3 },
      },
      fields: "gridProperties.frozenRowCount",
    },
  };
}

// ─── Export Donations ─────────────────────────────────────────────────────────

export async function exportDonationsToSheets(filters?: {
  startDate?: string;
  endDate?: string;
  eventId?: string;
  paymentMode?: string;
}) {
  const member = await requireRole(["admin", "treasurer"]);
  const { sheets } = await getGoogleSheetsClient();
  const club = await getClubSettings();
  const report = await getDonationsReport(filters || {});
  const donations = report.data || [];

  const today = fmtDate(new Date());
  const sheetTitle = `${club.name} — Donations Report (${today})`;

  // ── Create spreadsheet ──
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: sheetTitle, locale: "en_US" },
      sheets: [{ properties: { title: "Donations", sheetId: 0 } }],
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId!;
  const spreadsheetUrl = createRes.data.spreadsheetUrl!;

  // ── HEADER ROWS ──
  const titleRow = [`📊 ${club.name} — Donations Report`];
  const subRow = [
    `Generated on ${today} by ${member.fullName}  ·  ${donations.length} records  ·  Total: ${fmtAmt(report.summary.total)}`,
  ];

  // ── Column headers ──
  const headers = [
    "#",
    "Donor Name",
    "Email",
    "Phone",
    "Amount (₹)",
    "Payment Mode",
    "Transaction ID",
    "Donation Date",
    "Event / Campaign",
    "Collected By",
    "Status",
    "Notes",
    "Payment Screenshot",
  ];

  // ── Data rows ──
  const rows = donations.map((d: any, i: number) => [
    i + 1,
    d.donorName || "",
    d.donorEmail || "",
    d.donorPhone || "",
    fmtAmt(d.amount),
    capitalize(d.paymentMode || ""),
    d.transactionId || "—",
    fmtDate(d.donationDate),
    d.event?.name || "General Fund",
    d.submitter?.fullName || "",
    capitalize(d.status || "approved"),
    d.notes || "",
    d.screenshotUrl ? `=HYPERLINK("${d.screenshotUrl}","📎 View")` : "—",
  ]);

  // ── Totals row ──
  const totalAmount = donations.reduce(
    (sum: number, d: any) => sum + Number(d.amount || 0),
    0,
  );
  const totalsRow = [
    "",
    `TOTAL (${donations.length} donations)`,
    "",
    "",
    fmtAmt(totalAmount),
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];

  // ── Write all data ──
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Donations!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [titleRow, subRow, headers, ...rows, totalsRow] },
  });

  // ── Apply formatting ──
  const colCount = headers.length;
  const dataRowCount = rows.length;
  const HEADER_ROW = 2; // 0-indexed: row 0 = title, row 1 = sub, row 2 = column headers

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: buildStylingRequests(0, HEADER_ROW, dataRowCount, colCount),
    },
  });

  return {
    url: spreadsheetUrl,
    title: sheetTitle,
    count: donations.length,
  };
}

// ─── Export Expenses ──────────────────────────────────────────────────────────

export async function exportExpensesToSheets(filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  category?: string;
  eventId?: string;
}) {
  const member = await requireRole(["admin", "treasurer"]);
  const { sheets } = await getGoogleSheetsClient();
  const club = await getClubSettings();
  const report = await getExpensesReport(filters || {});
  const expenses = report.data || [];

  const today = fmtDate(new Date());
  const sheetTitle = `${club.name} — Expenses Report (${today})`;

  // ── Create spreadsheet ──
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: sheetTitle, locale: "en_US" },
      sheets: [{ properties: { title: "Expenses", sheetId: 0 } }],
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId!;
  const spreadsheetUrl = createRes.data.spreadsheetUrl!;

  // ── HEADER ROWS ──
  const totalApproved = expenses
    .filter((e: any) => e.status === "approved")
    .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
  const totalPending = expenses
    .filter((e: any) => e.status === "pending")
    .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

  const titleRow = [`📊 ${club.name} — Expenses Report`];
  const subRow = [
    `Generated on ${today} by ${member.fullName}  ·  ${expenses.length} records  ·  Approved: ${fmtAmt(totalApproved)}  ·  Pending: ${fmtAmt(totalPending)}`,
  ];

  // ── Column headers ──
  const headers = [
    "#",
    "Title",
    "Description",
    "Amount (₹)",
    "Category",
    "Expense Date",
    "Event",
    "Submitted By",
    "Status",
    "Approved By",
    "Approved On",
    "Receipt / Bill",
    "Rejection Reason",
  ];

  // ── Data rows ──
  const rows = expenses.map((e: any, i: number) => [
    i + 1,
    e.title || "",
    e.description || "",
    fmtAmt(e.amount),
    capitalize(e.category || ""),
    fmtDate(e.expenseDate),
    e.event?.name || "General",
    e.submitter?.fullName || "",
    capitalize(e.status || "pending"),
    e.approver?.fullName || "—",
    fmtDate(e.approvedAt) || "—",
    e.receiptUrl ? `=HYPERLINK("${e.receiptUrl}","🧾 View")` : "—",
    e.rejectionReason || "",
  ]);

  // ── Totals row ──
  const totalAmount = expenses.reduce(
    (sum: number, e: any) => sum + Number(e.amount || 0),
    0,
  );
  const totalsRow = [
    "",
    `TOTAL (${expenses.length} expenses)`,
    "",
    fmtAmt(totalAmount),
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];

  // ── Write all data ──
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Expenses!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [titleRow, subRow, headers, ...rows, totalsRow] },
  });

  // ── Apply formatting ──
  const colCount = headers.length;
  const dataRowCount = rows.length;
  const HEADER_ROW = 2;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: buildStylingRequests(0, HEADER_ROW, dataRowCount, colCount),
    },
  });

  return {
    url: spreadsheetUrl,
    title: sheetTitle,
    count: expenses.length,
  };
}

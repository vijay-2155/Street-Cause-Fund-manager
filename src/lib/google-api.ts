/**
 * Google Sheets + Drive API utilities for registration sync.
 * Uses OAuth refresh tokens stored in members.googleRefreshToken.
 * Requires env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 */

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${data.error_description || data.error || "Unknown error"}`);
  }
  return data.access_token as string;
}

/**
 * Fetch rows from a Google Sheet starting after already-synced rows.
 * Row 1 is assumed to be the header. Returns raw string arrays.
 * @param startRow Number of data rows already imported (0 = fetch all)
 */
export async function getSheetRows(
  accessToken: string,
  sheetId: string,
  _sheetName: string,
  startRow: number
): Promise<string[][]> {
  // Row 1 = header, data starts at row 2
  // If startRow=5, next row to fetch is row 7 (1 header + 5 synced + 1 next)
  const startRowNum = startRow + 2;
  // Use bare range without sheet name — defaults to first sheet, avoids name-parsing issues
  const range = `A${startRowNum}:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Google Sheets API error: ${data.error?.message || JSON.stringify(data.error) || "Unknown error"}`);
  }

  return (data.values as string[][]) || [];
}

/**
 * Extract Google Drive file ID from various Drive URL formats.
 * Handles: /file/d/ID/view, ?id=ID, /open?id=ID
 */
export function extractDriveFileId(driveUrl: string): string | null {
  if (!driveUrl) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = driveUrl.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Download a file from Google Drive using OAuth access token.
 * Returns the file buffer and its MIME type, or null on failure.
 */
export async function downloadDriveFile(
  accessToken: string,
  fileId: string
): Promise<{ buffer: ArrayBuffer; mimeType: string; extension: string } | null> {
  // Get file metadata
  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,name`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!metaRes.ok) return null;
  const meta = await metaRes.json();
  const mimeType: string = meta.mimeType || "image/jpeg";

  // Download file content
  const fileRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!fileRes.ok) return null;

  const buffer = await fileRes.arrayBuffer();
  const extension = mimeTypeToExtension(mimeType);
  return { buffer, mimeType, extension };
}

function mimeTypeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  return map[mimeType] || "jpg";
}

/**
 * Column indices for Shuttle Storm 2.0 Google Form responses sheet.
 * Google Forms appends columns in order: Timestamp, then each question.
 * Col 0: Timestamp
 * Col 1: Email Address
 * Col 2: Participant Name, age
 * Col 3: Contact number
 * Col 4: Gender
 * Col 5: Category
 * Col 6: 2nd participant Name, age
 * Col 7: Payment Transaction id
 * Col 8: Upload payment screenshot (Drive URL)
 */
export const FORM_COLUMNS = {
  TIMESTAMP: 0,
  EMAIL: 1,
  PARTICIPANT_NAME_AGE: 2,
  CONTACT: 3,
  GENDER: 4,
  CATEGORY: 5,
  PARTICIPANT2_NAME_AGE: 6,
  TRANSACTION_ID: 7,
  SCREENSHOT_URL: 8,
} as const;

export function normalizeGender(raw: string): "male" | "female" | null {
  const val = raw?.trim().toLowerCase();
  if (val === "male") return "male";
  if (val === "female") return "female";
  return null;
}

export function normalizeCategory(
  raw: string
): "mens_singles" | "womens_singles" | "mens_doubles" | "mixed_doubles" | null {
  const val = raw?.trim().toLowerCase();
  if (val.includes("men's singles") || val === "men's singles") return "mens_singles";
  if (val.includes("women's singles") || val === "women's singles") return "womens_singles";
  if (val.includes("men's doubles") || val === "mens_doubles") return "mens_doubles";
  if (val.includes("mixed")) return "mixed_doubles";
  // fallback substring checks
  if (val.startsWith("men") && val.includes("single")) return "mens_singles";
  if (val.startsWith("women") && val.includes("single")) return "womens_singles";
  if (val.startsWith("men") && val.includes("double")) return "mens_doubles";
  return null;
}

export function ticketAmountForCategory(
  category: "mens_singles" | "womens_singles" | "mens_doubles" | "mixed_doubles" | null
): number {
  if (category === "mens_singles" || category === "womens_singles") return 150;
  if (category === "mens_doubles" || category === "mixed_doubles") return 250;
  return 150; // default
}

/** Split "Name, age" strings like "Balu, 22" into name + age parts */
export function splitNameAge(raw: string): { name: string; age: string } {
  if (!raw) return { name: "", age: "" };
  const lastCommaIdx = raw.lastIndexOf(",");
  if (lastCommaIdx === -1) return { name: raw.trim(), age: "" };
  const name = raw.slice(0, lastCommaIdx).trim();
  const age = raw.slice(lastCommaIdx + 1).trim();
  return { name, age };
}

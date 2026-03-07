/**
 * Google Sheets API utilities for registration sync.
 * Uses API key — sheet must be shared "Anyone with the link can view".
 * Requires env var: GOOGLE_API_KEY
 */

/**
 * Fetch rows from a Google Sheet starting after already-synced rows.
 * Row 1 is assumed to be the header. Returns raw string arrays.
 * @param startRow Number of data rows already imported (0 = fetch all)
 */
export async function getSheetRows(
  sheetId: string,
  startRow: number
): Promise<string[][]> {
  const startRowNum = startRow + 2; // row 1 = header, data starts at row 2
  const range = `A${startRowNum}:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${process.env.GOOGLE_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Google Sheets API error: ${data.error?.message || JSON.stringify(data.error) || "Unknown error"}`
    );
  }

  return (data.values as string[][]) || [];
}

/**
 * Extract Google Drive file ID from various Drive URL formats.
 * Handles: /file/d/ID/view, ?id=ID
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
 * Convert a Drive file ID to a direct embeddable image URL.
 * Uses the thumbnail endpoint which serves inline without redirect/confirmation page.
 * Works when the file (or its parent folder) is shared "Anyone with the link can view".
 */
export function driveFileIdToImageUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

/**
 * Column indices for the Google Form responses sheet.
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
  // Check women's BEFORE men's — "women's singles" contains "men's singles" as substring
  if (val.includes("women") && val.includes("single")) return "womens_singles";
  if (val.includes("men") && val.includes("single")) return "mens_singles";
  if (val.includes("mixed")) return "mixed_doubles";
  if (val.includes("men") && val.includes("double")) return "mens_doubles";
  return null;
}

export function ticketAmountForCategory(
  category: "mens_singles" | "womens_singles" | "mens_doubles" | "mixed_doubles" | null
): number {
  if (category === "mens_singles" || category === "womens_singles") return 150;
  if (category === "mens_doubles" || category === "mixed_doubles") return 250;
  return 150;
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

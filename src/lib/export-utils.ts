import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Types
interface ExportData {
  headers: string[];
  rows: any[][];
  title: string;
  subtitle?: string;
  clubName?: string;
  clubLogo?: string;
  summary?: { label: string; value: string }[];
}

// Format currency for display (Rs. for PDF-safe, used everywhere)
export const formatCurrency = (amount: number) => {
  const numAmount = Number(amount) || 0;
  const formatted = numAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
  return `Rs. ${formatted}`;
};

// Format date for display
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Brand Colors ──────────────────────────────────────────────────────────────
const C = {
  blue: [0, 102, 255] as [number, number, number],
  blueDark: [0, 82, 204] as [number, number, number],
  blueLight: [230, 242, 255] as [number, number, number],
  dark: [26, 26, 31] as [number, number, number],
  gray50: [249, 250, 251] as [number, number, number],
  gray200: [229, 231, 235] as [number, number, number],
  gray500: [107, 114, 128] as [number, number, number],
  gray900: [17, 24, 39] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [16, 185, 129] as [number, number, number],
  greenLight: [209, 250, 229] as [number, number, number],
  greenDark: [5, 150, 105] as [number, number, number],
};

// ─── PDF Export ────────────────────────────────────────────────────────────────
export const exportToPDF = (data: ExportData) => {
  const doc = new jsPDF({ orientation: "landscape" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const club = data.clubName || "Street Cause";

  // ── Header Banner ───────────────────
  // Blue banner
  doc.setFillColor(...C.blue);
  doc.rect(0, 0, pw, 36, "F");
  // Dark accent stripe
  doc.setFillColor(...C.blueDark);
  doc.rect(0, 0, pw, 2.5, "F");

  // Club name — plain text, no emoji
  doc.setTextColor(...C.white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(club, 15, 16);

  // Report title
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(data.title, 15, 24);

  // Subtitle
  if (data.subtitle) {
    doc.setFontSize(9);
    doc.text(data.subtitle, 15, 31);
  }

  // Date badge on right
  doc.setFillColor(...C.white);
  doc.roundedRect(pw - 62, 8, 52, 20, 2, 2, "F");
  doc.setTextColor(...C.blue);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("GENERATED ON", pw - 59, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(today, pw - 59, 23);

  let yPos = 46;

  // ── Summary Cards ──
  if (data.summary && data.summary.length > 0) {
    const n = data.summary.length;
    const gap = 4;
    const cardW = (pw - 30 - (n - 1) * gap) / n;

    data.summary.forEach((item, idx) => {
      const x = 15 + idx * (cardW + gap);

      // Card border + fill
      doc.setFillColor(...C.white);
      doc.setDrawColor(...C.gray200);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, yPos, cardW, 18, 1.5, 1.5, "FD");

      // Blue top accent
      doc.setFillColor(...C.blue);
      doc.rect(x + 1, yPos + 0.5, cardW - 2, 1.5, "F");

      // Label
      doc.setFontSize(6.5);
      doc.setTextColor(...C.gray500);
      doc.setFont("helvetica", "bold");
      doc.text(item.label.toUpperCase(), x + 4, yPos + 7);

      // Value — sanitized for jsPDF (no Unicode symbols)
      doc.setFontSize(10);
      doc.setTextColor(...C.blue);
      doc.setFont("helvetica", "bold");
      const safeVal = sanitizeForPDF(String(item.value));
      doc.text(safeVal, x + 4, yPos + 14, { maxWidth: cardW - 8 });
    });

    yPos += 24;
  }

  // ── Prepare table data — sanitize all text for jsPDF ──
  const safeHeaders = data.headers.map(sanitizeForPDF);
  const safeRows = data.rows.map((row) =>
    row.map((cell) => sanitizeForPDF(String(cell ?? ""))),
  );

  // Totals row
  const amountIdx = data.headers.findIndex((h) =>
    h.toLowerCase().includes("amount"),
  );
  const totalsRow = safeHeaders.map((_, idx) => {
    if (idx === 0) return `TOTAL (${data.rows.length} records)`;
    if (idx === amountIdx) {
      const total = data.rows.reduce((sum, row) => {
        const raw = String(row[amountIdx] || "").replace(/[^0-9.-]/g, "");
        return sum + (Number(raw) || 0);
      }, 0);
      return `Rs. ${total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return "";
  });

  // ── Table ──
  autoTable(doc, {
    head: [safeHeaders],
    body: [...safeRows, totalsRow],
    startY: yPos,
    theme: "grid",
    headStyles: {
      fillColor: C.dark,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
    },
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      lineColor: C.gray200,
      lineWidth: 0.15,
      textColor: C.gray900,
      overflow: "linebreak",
      cellWidth: "wrap",
    },
    alternateRowStyles: {
      fillColor: C.gray50,
    },
    columnStyles: {
      0: { fontStyle: "bold", textColor: C.gray900, cellWidth: "auto" },
    },
    margin: { top: 10, left: 15, right: 15, bottom: 22 },
    willDrawCell: (hook) => {
      // Green totals row (last body row)
      if (hook.section === "body" && hook.row.index === safeRows.length) {
        hook.cell.styles.fillColor = C.greenLight;
        hook.cell.styles.textColor = C.greenDark;
        hook.cell.styles.fontStyle = "bold";
        hook.cell.styles.fontSize = 8.5;
      }
    },
    didDrawPage: (hook) => {
      // ── Footer ──
      const fy = ph - 12;
      doc.setFillColor(...C.gray50);
      doc.rect(0, fy - 3, pw, 15, "F");
      doc.setFillColor(...C.blue);
      doc.rect(0, ph - 2, pw, 2, "F");

      doc.setFontSize(7);
      doc.setTextColor(...C.gray500);
      doc.setFont("helvetica", "normal");
      doc.text(club, 15, fy + 3);

      doc.setFont("helvetica", "bold");
      const tw = doc.getTextWidth(data.title);
      doc.text(data.title, (pw - tw) / 2, fy + 3);

      const pt = `Page ${hook.pageNumber}`;
      doc.text(pt, pw - doc.getTextWidth(pt) - 15, fy + 3);

      doc.setFontSize(6);
      doc.setTextColor(190, 190, 190);
      doc.setFont("helvetica", "italic");
      const b = "Generated with Street Cause Fund Manager";
      doc.text(b, (pw - doc.getTextWidth(b)) / 2, fy + 7);
    },
  });

  const filename = `${data.title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
};

// Sanitize text for jsPDF (no emoji, no ₹ → use Rs.)
function sanitizeForPDF(text: string): string {
  return (
    text
      // Replace ₹ with Rs.
      .replace(/₹/g, "Rs.")
      // Remove emoji and special unicode (surrogate pairs, misc symbols, dingbats, etc.)
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
      .replace(/[\u{2600}-\u{27BF}]/gu, "")
      .replace(/[\u{FE00}-\u{FEFF}]/gu, "")
      .replace(/[\u200B-\u200F\u2028-\u202F\u2060-\u206F]/g, "")
      .trim()
  );
}

// ─── Excel Export ──────────────────────────────────────────────────────────────
// Matches the Google Sheets template: title row, info row, column headers, data, totals
export const exportToExcel = (data: ExportData) => {
  const wb = XLSX.utils.book_new();
  const club = data.clubName || "Street Cause";
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const wsData: any[][] = [];

  // Row 0: Title (same as Google Sheets)
  wsData.push([`${club} - ${data.title}`]);

  // Row 1: Sub-info
  const infoParts = [`Generated on ${today}`];
  if (data.subtitle) infoParts.push(data.subtitle);
  infoParts.push(`${data.rows.length} records`);
  if (data.summary) {
    data.summary.forEach((s) => infoParts.push(`${s.label}: ${s.value}`));
  }
  wsData.push([infoParts.join("  |  ")]);

  // Row 2: Column headers (with # as first column)
  const headers = ["#", ...data.headers];
  wsData.push(headers);

  // Data rows with row numbers
  data.rows.forEach((row, i) => {
    wsData.push([i + 1, ...row]);
  });

  // Totals row
  const amountIdx = data.headers.findIndex((h) =>
    h.toLowerCase().includes("amount"),
  );
  const totalsRow: any[] = ["", `TOTAL (${data.rows.length} records)`];
  for (let i = 1; i < data.headers.length; i++) {
    if (i === amountIdx) {
      const total = data.rows.reduce((sum, row) => {
        const raw = String(row[i] || "").replace(/[^0-9.-]/g, "");
        return sum + (Number(raw) || 0);
      }, 0);
      totalsRow.push(formatCurrency(total));
    } else {
      totalsRow.push("");
    }
  }
  wsData.push(totalsRow);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths — auto-sized from content
  const colCount = headers.length;
  const colWidths = headers.map((_, colIdx) => {
    let max = 6;
    wsData.forEach((row) => {
      const len = String(row[colIdx] || "").length;
      if (len > max) max = len;
    });
    return { wch: Math.min(max + 3, 45) };
  });
  // First column (#) narrow
  colWidths[0] = { wch: 5 };
  ws["!cols"] = colWidths;

  // Merge title and info rows across all columns
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
  ];

  // Row heights
  ws["!rows"] = [
    { hpt: 30 }, // title
    { hpt: 18 }, // info
    { hpt: 22 }, // headers
  ];

  // Add to workbook
  const sheetName =
    data.title.length > 31 ? data.title.slice(0, 31) : data.title;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const filename = `${data.title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

// Generate preview data
export const generatePreviewData = (data: ExportData) => {
  return {
    title: data.title,
    subtitle: data.subtitle,
    clubName: data.clubName,
    summary: data.summary,
    headers: data.headers,
    rows: data.rows.slice(0, 10),
    totalRows: data.rows.length,
  };
};

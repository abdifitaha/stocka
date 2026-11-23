import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ORANGE: [number, number, number] = [234, 88, 12];
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_500: [number, number, number] = [100, 116, 139];

export type PdfCell = string | number;
export interface PdfSection { title?: string; head: string[]; rows: PdfCell[][]; rightAlign?: number[] }

/** Draws the stocka logo (orange rounded square with a white box) at x, y. */
function drawLogo(doc: jsPDF, x: number, y: number, s: number) {
  doc.setFillColor(...ORANGE);
  doc.roundedRect(x, y, s, s, s * 0.25, s * 0.25, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(s * 0.06);
  const cx = x + s / 2, cy = y + s / 2, r = s * 0.27;
  const top = [cx, cy - r], tr = [cx + r, cy - r / 2], br = [cx + r, cy + r / 2], bot = [cx, cy + r], bl = [cx - r, cy + r / 2], tl = [cx - r, cy - r / 2];
  const pts = [top, tr, br, bot, bl, tl];
  pts.forEach((p, i) => { const n = pts[(i + 1) % 6]; doc.line(p[0], p[1], n[0], n[1]); });
  doc.line(tl[0], tl[1], cx, cy); doc.line(tr[0], tr[1], cx, cy); doc.line(cx, cy, bot[0], bot[1]);
}

/** Builds a simple branded PDF (logo + name header, summary lines, tables) and downloads it. */
export function exportPdf(opts: { title: string; subtitle?: string; summary?: [string, string][]; sections: PdfSection[]; filename: string }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  drawLogo(doc, M, 32, 32);
  doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(...SLATE_900);
  doc.text("stocka", M + 42, 54);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...SLATE_500);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, W - M, 54, { align: "right" });
  doc.setDrawColor(...ORANGE).setLineWidth(1.5).line(M, 78, W - M, 78);

  doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(...SLATE_900);
  doc.text(opts.title, M, 104);
  let y = 104;
  if (opts.subtitle) {
    y += 16;
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...SLATE_500);
    doc.text(opts.subtitle, M, y);
  }
  if (opts.summary?.length) {
    y += 22;
    doc.setFontSize(10);
    opts.summary.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal").setTextColor(...SLATE_500).text(label, M, y);
      doc.setFont("helvetica", "bold").setTextColor(...SLATE_900).text(value, M + 130, y);
      y += 15;
    });
  }
  y += 8;

  for (const s of opts.sections) {
    if (s.title) {
      doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...ORANGE);
      doc.text(s.title, M, y + 10);
      y += 16;
    }
    autoTable(doc, {
      startY: y + 4,
      head: [s.head],
      body: s.rows.map(r => r.map(String)),
      margin: { left: M, right: M },
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 5, textColor: SLATE_900, lineWidth: 0.5, lineColor: [203, 213, 225] },
      headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: Object.fromEntries((s.rightAlign ?? []).map(i => [i, { halign: "right" as const }])),
      // headers follow the same alignment as their data, so each column lines up
      didParseCell: d => { if (d.section === "head" && (s.rightAlign ?? []).includes(d.column.index)) d.cell.styles.halign = "right"; },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...SLATE_500);
    doc.text(`stocka · Page ${i} of ${pages}`, W / 2, doc.internal.pageSize.getHeight() - 20, { align: "center" });
  }
  doc.save(opts.filename);
}

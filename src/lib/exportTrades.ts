import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

export interface ExportTrade {
  sno?: number;
  createdAt: string;
  assetPair: string;
  strategy?: string;
  session?: string;
  entry: string;
  tp: string;
  sl: string;
  rr: string;
  result: string;
  reason?: string;
  learning?: string;
}

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
};

export function exportTradesCSV(trades: ExportTrade[], filename = "trades.csv") {
  const headers = ["#", "Date", "Asset", "Strategy", "Session", "Entry", "TP", "SL", "R/R", "Result", "Reason", "Learning"];
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = trades.map((t) => [
    t.sno ?? "", fmtDate(t.createdAt), t.assetPair, t.strategy || "", t.session || "",
    t.entry, t.tp, t.sl, t.rr, t.result, t.reason || "", t.learning || "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function exportTradesPDF(trades: ExportTrade[], filename = "trades.pdf") {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(16);
  doc.text("Trading History Report", 40, 40);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString()}  ·  ${trades.length} trades`, 40, 58);

  autoTable(doc, {
    startY: 80,
    head: [["#", "Date", "Asset", "Strategy", "Session", "Entry", "TP", "SL", "R/R", "Result"]],
    body: trades.map((t) => [
      t.sno ?? "", fmtDate(t.createdAt), t.assetPair, t.strategy || "-", t.session || "-",
      t.entry, t.tp, t.sl, t.rr, (t.result || "").toUpperCase(),
    ]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 9) {
        const v = String(data.cell.raw || "").toUpperCase();
        if (v === "WIN") data.cell.styles.textColor = [22, 163, 74];
        else if (v === "LOSS") data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  doc.save(filename);
}

export async function printElementAsPDF(el: HTMLElement, filename: string) {
  const canvas = await html2canvas(el, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  pdf.addImage(img, "PNG", (pageW - w) / 2, 20, w, h);
  pdf.save(filename);
}

export async function printElementAsPNG(el: HTMLElement, filename: string) {
  const canvas = await html2canvas(el, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
}

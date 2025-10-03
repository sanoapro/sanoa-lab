// lib/pdf.ts
import { PDFDocument, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

export async function newPdf() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage();
  page.setFont(font);
  return { pdf, page, font, bold, W: page.getWidth(), H: page.getHeight() };
}

export async function pngFromDataUrl(pdf: PDFDocument, dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  const bin = Buffer.from(base64, "base64");
  return await pdf.embedPng(bin);
}

export async function makeQrDataUrl(text: string) {
  return await QRCode.toDataURL(text, { margin: 0, scale: 4 });
}

// texto envuelto simple
export function drawWrappedText(
  page: any,
  text: string,
  x: number,
  y: number,
  width: number,
  size: any = 10,
) {
  const words = String(text).split(/\s+/);
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    const tw = page.getFont().widthOfTextAtSize(test, size);
    if (tw > width) {
      page.drawText(line, { x, y: yy, size });
      yy -= size + 2;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) page.drawText(line, { x, y: yy, size });
  return yy - size - 2;
}

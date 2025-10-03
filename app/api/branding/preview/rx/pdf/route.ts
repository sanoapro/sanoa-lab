export const runtime = "nodejs";
// MODE: session (user-scoped, cookies)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http/validate";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

async function fetchAsUint8(url: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    const ab = await r.arrayBuffer();
    return new Uint8Array(ab);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const qp = new URL(req.url).searchParams;
  const org_id = qp.get("org_id") ?? undefined;
  if (!org_id) return jsonError("BAD_REQUEST", "Falta org_id", 400);

  const { data: me } = await supa.auth.getUser();
  const provider_id = qp.get("provider_id") ?? me?.user?.id ?? null;
  if (!provider_id) return jsonError("UNAUTHORIZED", "No provider", 401);

  const { data: pb, error } = await supa
    .from("provider_branding")
    .select("*")
    .eq("org_id", org_id)
    .eq("provider_id", provider_id)
    .maybeSingle();
  if (error) return jsonError("DB_ERROR", error.message, 400);

  // Datos demo
  const patientName = qp.get("patient_name") ?? "Paciente de ejemplo";
  const providerName = qp.get("provider_name") ?? "Especialista";
  const content = [
    { medication: "Paracetamol 500mg", dose: "1 tableta", frequency: "c/8h", duration: "3 días" },
    {
      medication: "Ibuprofeno 400mg",
      dose: "1 tableta",
      frequency: "c/12h",
      duration: "2 días",
      notes: "Después de alimentos",
    },
  ];
  const folio = "PREVIEW-" + new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

  const draw = (
    text: string,
    x: number,
    y: number,
    size: any = 11,
    bold: any = false,
    color: any = rgb(0, 0, 0),
  ) => {
    page.drawText(text, { x, y, size, font: bold ? fontB : font, color });
  };
  const marginX = 50;
  let cursorY = 810;

  // Membrete
  if (pb?.letterhead_url) {
    const data = await fetchAsUint8(pb.letterhead_url);
    if (data) {
      try {
        const img = await pdf.embedPng(data).catch(async () => await pdf.embedJpg(data));
        const maxW = 495;
        const ratio = img.width / img.height;
        const w = Math.min(maxW, img.width);
        const h = w / ratio;
        page.drawImage(img, { x: marginX, y: cursorY - h, width: w, height: h });
        cursorY -= h + 10;
      } catch {
        /* ignore */
      }
    }
  }
  if (cursorY > 770) {
    draw(pb?.clinic_name ?? "RECETA — Previsualización", marginX, cursorY, 16, true);
    cursorY -= 24;
  }

  draw(`Folio: ${folio}`, marginX, cursorY, 10);
  draw(`Fecha: ${new Date().toLocaleString()}`, marginX + 250, cursorY, 10);
  cursorY -= 16;
  draw(`Paciente: ${patientName}`, marginX, cursorY, 12, true);
  cursorY -= 20;

  draw("Indicaciones:", marginX, cursorY, 12, true);
  cursorY -= 16;

  const maxWidthChars = 95;
  const writeLines = (text: string) => {
    const lines = text.split("\n");
    for (const ln of lines) {
      const chunks = ln.match(new RegExp(`.{1,${maxWidthChars}}`, "g")) ?? [ln];
      for (const ch of chunks) {
        page.drawText(ch, { x: marginX, y: cursorY, size: 10, font });
        cursorY -= 14;
      }
    }
  };
  for (const item of content) {
    const med = item.medication ?? "";
    const dose = item.dose ? ` · Dosis: ${item.dose}` : "";
    const freq = item.frequency ? ` · Frecuencia: ${item.frequency}` : "";
    const dur = item.duration ? ` · Duración: ${item.duration}` : "";
    const note = item.notes ? ` · Nota: ${item.notes}` : "";
    writeLines(`• ${med}${dose}${freq}${dur}${note}`);
  }

  // Firma / sello
  cursorY = Math.max(cursorY, 150);
  draw("Firma:", marginX, 140, 11, true);
  if (pb?.signature_url) {
    try {
      const imgBytes = await fetchAsUint8(pb.signature_url);
      if (imgBytes) {
        const img = await pdf.embedPng(imgBytes).catch(async () => await pdf.embedJpg(imgBytes));
        const w = 160,
          h = w / (img.width / img.height);
        page.drawImage(img, { x: marginX + 48, y: 120, width: w, height: h });
      } else if (pb?.signature_name) {
        draw(pb.signature_name, marginX + 48, 140, 11);
      }
    } catch {
      if (pb?.signature_name) draw(pb.signature_name, marginX + 48, 140, 11);
    }
  } else if (pb?.signature_name) {
    draw(pb.signature_name, marginX + 48, 140, 11);
  }

  draw(providerName, marginX, 100, 10, true);
  if (pb?.license_number) draw(`Cédula: ${pb.license_number}`, marginX, 86, 9);

  // QR con texto informativo
  try {
    const info = `Previsualización de receta — ${providerName}`;
    const qrDataUrl = await QRCode.toDataURL(info, { margin: 0, scale: 4 });
    const res = await fetch(qrDataUrl);
    const buf = new Uint8Array(await res.arrayBuffer());
    const qrImg = await pdf.embedPng(buf);
    const size = 92;
    page.drawImage(qrImg, { x: 595.28 - size - 40, y: 50, width: size, height: size });
  } catch {
    /* ignore */
  }

  const bytes = await pdf.save();
  return new NextResponse(new Blob([bytes]), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="preview_receta.pdf"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

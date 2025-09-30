// MODE: session (user-scoped, cookies)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonError, readOrgIdFromQuery } from "@/lib/http/validate";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

// Helpers
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

type Rx = {
  id: string;
  org_id: string;
  patient_id: string | null;
  provider_id: string | null;
  content: any;
  letterhead_url?: string | null;
  signature_name?: string | null;
  signature_url?: string | null;
  notes?: string | null;
  status: "draft" | "signed";
  folio?: string | null;
  created_at?: string | null;
};

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const id = ctx.params.id;

  // Cargar receta
  let base = supa.from("prescriptions").select("*").eq("id", id).limit(1);
  const org = readOrgIdFromQuery(req);
  if (org.ok) base = base.eq("org_id", org.org_id);

  const { data: rx, error } = await base.single<Rx>();
  if (error || !rx) return jsonError("NOT_FOUND", "Receta no encontrada", 404);

  // Asegurar folio (RPC idempotente). Si no existe el RPC, seguimos sin folio.
  if (!rx.folio) {
    const { data: ensured, error: e1 } = await supa.rpc("ensure_rx_folio", {
      p_org_id: rx.org_id,
      p_id: rx.id,
      p_prefix: "RX",
    });
    if (!e1 && ensured) {
      const { data: rx2 } = await supa
        .from("prescriptions")
        .select("folio")
        .eq("id", rx.id)
        .maybeSingle();
      if (rx2?.folio) rx.folio = rx2.folio;
    }
  }

  // (Opcional) Paciente
  let patientName = "Paciente";
  const patientId = rx.patient_id ?? "";
  {
    const { data: p } = await supa
      .from("patients")
      .select("full_name")
      .eq("id", rx.patient_id)
      .maybeSingle();
    if (p?.full_name) patientName = p.full_name;
  }

  // (Opcional) Especialista
  let providerName = "Especialista";
  {
    const { data: pr } = await supa
      .from("profiles")
      .select("full_name")
      .eq("id", rx.provider_id)
      .maybeSingle();
    if (pr?.full_name) providerName = pr.full_name;
  }

  const origin = new URL(req.url).origin;
  const verifyUrl = `${origin}/api/prescriptions/${rx.id}/json${
    org.ok ? `?org_id=${rx.org_id}` : ""
  }`;

  // Construir PDF (A4)
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

  const draw = (
    text: string,
    x: number,
    y: number,
    size = 11,
    bold = false,
    color = rgb(0, 0, 0)
  ) => {
    page.drawText(text, { x, y, size, font: bold ? fontB : font, color });
  };
  const marginX = 50;
  let cursorY = 810;

  // Membrete (si hay imagen)
  if (rx.letterhead_url) {
    const data = await fetchAsUint8(rx.letterhead_url);
    if (data) {
      try {
        const img = await pdf.embedPng(data).catch(async () => await pdf.embedJpg(data));
        const maxW = 495; // ancho útil
        const ratio = img.width / img.height;
        const w = Math.min(maxW, img.width);
        const h = w / ratio;
        page.drawImage(img, { x: marginX, y: cursorY - h, width: w, height: h });
        cursorY -= h + 10;
      } catch {
        // si falla, continuamos con encabezado textual
      }
    }
  }

  // Encabezado textual (si no hubo imagen)
  if (cursorY > 770) {
    draw("RECETA MÉDICA", marginX, cursorY, 16, true);
    cursorY -= 24;
  }

  // Datos de cabecera
  draw(`Folio: ${rx.folio ?? rx.id}`, marginX, cursorY, 10);
  draw(
    `Fecha: ${new Date(rx.created_at ?? Date.now()).toLocaleString()}`,
    marginX + 250,
    cursorY,
    10
  );
  cursorY -= 16;
  draw(`Paciente: ${patientName}`, marginX, cursorY, 12, true);
  cursorY -= 20;

  // Contenido
  draw("Indicaciones:", marginX, cursorY, 12, true);
  cursorY -= 16;

  // Render contenido (string o lista JSON común)
  const maxWidthChars = 95;
  const writeLines = (text: string) => {
    const lines = text.split("\n");
    for (const ln of lines) {
      const chunks = ln.match(new RegExp(`.{1,${maxWidthChars}}`, "g")) ?? [ln];
      for (const ch of chunks) {
        page.drawText(ch, { x: marginX, y: cursorY, size: 10, font, color: rgb(0, 0, 0) });
        cursorY -= 14;
      }
    }
  };

  if (Array.isArray(rx.content)) {
    for (const item of rx.content) {
      const med = item?.medication ?? item?.drug ?? "";
      const dose = item?.dose ? ` · Dosis: ${item.dose}` : "";
      const freq = item?.frequency ? ` · Frecuencia: ${item.frequency}` : "";
      const dur = item?.duration ? ` · Duración: ${item.duration}` : "";
      const note = item?.notes ? ` · Nota: ${item.notes}` : "";
      writeLines(`• ${med}${dose}${freq}${dur}${note}`);
    }
  } else if (typeof rx.content === "string") {
    writeLines(rx.content);
  } else {
    writeLines(JSON.stringify(rx.content ?? {}, null, 2));
  }

  // Firma
  cursorY = Math.max(cursorY, 150);
  draw("Firma:", marginX, 140, 11, true);
  if (rx.signature_url) {
    const imgBytes = await fetchAsUint8(rx.signature_url);
    if (imgBytes) {
      try {
        const img = await pdf.embedPng(imgBytes).catch(async () => await pdf.embedJpg(imgBytes));
        const w = 160;
        const ratio = img.width / img.height;
        const h = w / ratio;
        page.drawImage(img, { x: marginX + 48, y: 120, width: w, height: h });
      } catch {
        if (rx.signature_name) draw(rx.signature_name, marginX + 48, 140, 11);
      }
    } else if (rx.signature_name) {
      draw(rx.signature_name, marginX + 48, 140, 11);
    }
  } else if (rx.signature_name) {
    draw(rx.signature_name, marginX + 48, 140, 11);
  }

  // Sello inferior (proveedor / verificación)
  draw(providerName, marginX, 100, 10, true);
  if (patientId) draw(`Paciente ID: ${patientId}`, marginX, 86, 9);
  draw("Verificación:", marginX, 72, 9);

  // QR
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0, scale: 4 });
    const res = await fetch(qrDataUrl);
    const buf = new Uint8Array(await res.arrayBuffer());
    const qrImg = await pdf.embedPng(buf);
    const size = 92;
    page.drawImage(qrImg, { x: 595.28 - size - 40, y: 50, width: size, height: size });
  } catch {
    // si el QR falla, escribimos la URL
    writeLines(verifyUrl);
  }

  const bytes = await pdf.save();
  const filename = `receta_${rx.folio ?? rx.id}.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

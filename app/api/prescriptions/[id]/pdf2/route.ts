export const runtime = "nodejs";
// MODE: session (user-scoped, cookies)
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

const Params = z.object({ id: z.string().uuid() });
const Query = z.object({
  org_id: z.string().uuid(),
});

type Branding = {
  clinic_name?: string | null;
  sign_name?: string | null;
  sign_role?: string | null;
  license?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  letterhead_path?: string | null;
  signature_path?: string | null;
};

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const supa = await getSupabaseServer();

  // Validar params/query
  const pp = Params.safeParse(ctx.params);
  if (!pp.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "id inválido" } },
      { status: 400 },
    );
  }
  const qp = new URL(req.url).searchParams;
  const qv = Query.safeParse({ org_id: qp.get("org_id") });
  if (!qv.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "org_id requerido" } },
      { status: 400 },
    );
  }
  const org_id = qv.data.org_id;
  const prescription_id = pp.data.id;

  // Usuario (proveedor actual)
  const { data: me, error: eUser } = await supa.auth.getUser();
  if (eUser || !me?.user?.id) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sin sesión" } },
      { status: 401 },
    );
  }
  const provider_id = me.user.id;

  // 1) Cargar payload de receta desde tu JSON existente (compatibilidad)
  const jsonUrl = new URL(req.url);
  jsonUrl.pathname = `/api/prescriptions/${prescription_id}/json`;
  // Reenviamos cookies para mantener sesión
  const jsonRes = await fetch(jsonUrl.toString(), {
    headers: { cookie: req.headers.get("cookie") ?? "" },
    cache: "no-store",
  });

  if (!jsonRes.ok) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "No se pudo cargar la receta" } },
      { status: 404 },
    );
  }
  const payload = await jsonRes.json().catch(() => null);
  const data = payload?.data ?? payload; // soporta { ok:true, data } o data plano

  // 2) Branding: provider_identity (si existe) + Storage (letterheads/signatures)
  const branding = await getBranding(supa, org_id, provider_id);

  const letterheadBytes = await loadStorageImage(
    supa,
    "letterheads",
    branding.letterhead_path || `${org_id}/${provider_id}.png`,
  );
  const signatureBytes = await loadStorageImage(
    supa,
    "signatures",
    branding.signature_path || `${org_id}/${provider_id}.png`,
  );

  // 3) Armar PDF con pdf-lib
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait
  const { width, height } = page.getSize();
  const margin = 40;
  const drawY = { y: height - margin };

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Header: letterhead o texto
  if (letterheadBytes) {
    try {
      const img = await pdf.embedPng(letterheadBytes);
      const iw = img.width,
        ih = img.height;
      const targetW = width - margin * 2;
      const scale = targetW / iw;
      const targetH = ih * scale;
      page.drawImage(img, { x: margin, y: drawY.y - targetH, width: targetW, height: targetH });
      drawY.y -= targetH + 16;
    } catch {
      drawY.y -= 8;
    }
  } else {
    // Fallback textual
    const header = branding.clinic_name || "Receta médica";
    page.drawText(header, { x: margin, y: drawY.y - 16, size: 16, font: fontBold });
    if (branding.address) {
      page.drawText(branding.address, {
        x: margin,
        y: drawY.y - 32,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      drawY.y -= 36;
    } else {
      drawY.y -= 24;
    }
  }

  // Título
  page.drawText("Receta médica", { x: margin, y: drawY.y - 18, size: 18, font: fontBold });
  drawY.y -= 28;

  // Paciente y metadata (intentamos adaptarnos a tus campos)
  const patientName =
    data?.patient?.name ||
    data?.patient?.full_name ||
    data?.patient_name ||
    data?.patient?.display_name ||
    "Paciente";
  const issuedAt = data?.issued_at || data?.created_at || new Date().toISOString();
  const folio = data?.folio || data?.id || prescription_id;

  drawField(page, fontBold, font, "Paciente", String(patientName), margin, drawY);
  drawField(
    page,
    fontBold,
    font,
    "Fecha",
    new Date(issuedAt).toLocaleString("es-MX"),
    margin,
    drawY,
  );
  drawField(page, fontBold, font, "Folio", String(folio), margin, drawY);
  drawY.y -= 8;

  // Medicamentos / Indicaciones
  page.drawText("Indicaciones:", { x: margin, y: drawY.y - 14, size: 12, font: fontBold });
  drawY.y -= 20;

  const lines = formatPrescriptionLines(data);
  for (const line of lines) {
    if (drawY.y < 120) break; // margen inferior dejando espacio a firma/QR
    page.drawText(line, { x: margin + 8, y: drawY.y - 12, size: 11, font });
    drawY.y -= 16;
  }

  // Firma
  if (signatureBytes) {
    try {
      const img = await pdf.embedPng(signatureBytes);
      const iw = img.width,
        ih = img.height;
      const targetW = 180;
      const scale = targetW / iw;
      const targetH = ih * scale;
      const sigY = 120 + targetH;
      page.drawImage(img, { x: margin, y: sigY, width: targetW, height: targetH });
      // Línea y texto
      page.drawText(branding.sign_name || "", { x: margin, y: 120, size: 11, font: fontBold });
      const meta = [branding.sign_role, branding.license].filter(Boolean).join(" · ");
      if (meta)
        page.drawText(meta, { x: margin, y: 106, size: 10, font, color: rgb(0.25, 0.25, 0.25) });
    } catch {
      drawSignatureFallback(page, margin, branding, fontBold, font);
    }
  } else {
    drawSignatureFallback(page, margin, branding, fontBold, font);
  }

  // QR de verificación (hacia JSON de la receta protegido por RLS)
  try {
    const verifyUrl = new URL(req.url);
    verifyUrl.pathname = `/api/prescriptions/${prescription_id}/json`;
    const qrDataURL = await QRCode.toDataURL(verifyUrl.toString(), { margin: 0, scale: 3 });
    const png = dataURLtoBytes(qrDataURL);
    const qrImg = await pdf.embedPng(png);
    page.drawImage(qrImg, { x: width - margin - 90, y: 90, width: 90, height: 90 });
    page.drawText("Verificar", {
      x: width - margin - 82,
      y: 82,
      size: 9,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });
  } catch {
    // omitimos QR en caso de error
  }

  // Pie con datos de contacto (si hay)
  const footerBits = [branding.phone, branding.website].filter(Boolean).join("  •  ");
  if (footerBits) {
    page.drawText(footerBits, { x: margin, y: 80, size: 9, font, color: rgb(0.25, 0.25, 0.25) });
  }

  const pdfBytes = await pdf.save();

  // ✅ Body como Uint8Array casteado para satisfacer BodyInit en Response
  return new Response(pdfBytes as any, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="receta-${prescription_id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Intenta leer provider_identity; si no existe la tabla, devuelve vacíos */
async function getBranding(supa: any, org_id: string, provider_id: string): Promise<Branding> {
  try {
    const { data, error } = await supa
      .from("provider_identity")
      .select(
        "clinic_name,sign_name,sign_role,license,phone,address,website,letterhead_path,signature_path",
      )
      .eq("org_id", org_id)
      .eq("provider_id", provider_id)
      .maybeSingle();
    if (error) return {};
    return (data || {}) as Branding;
  } catch {
    return {};
  }
}

async function loadStorageImage(
  supa: any,
  bucket: "letterheads" | "signatures",
  path: string | null,
) {
  if (!path) return null;
  try {
    const { data, error } = await supa.storage.from(bucket).download(path);
    if (error || !data) return null;
    const ab = await data.arrayBuffer();
    return new Uint8Array(ab);
  } catch {
    return null;
  }
}

function drawField(
  page: any,
  fontBold: any,
  font: any,
  label: string,
  value: string,
  margin: number,
  drawY: { y: number },
) {
  page.drawText(`${label}:`, { x: margin, y: drawY.y - 12, size: 11, font: fontBold });
  page.drawText(value, { x: margin + 60, y: drawY.y - 12, size: 11, font });
  drawY.y -= 18;
}

function drawSignatureFallback(
  page: any,
  margin: number,
  branding: Branding,
  fontBold: any,
  font: any,
) {
  // Línea y texto de firma sin imagen
  page.drawText("__________________________", { x: margin, y: 130, size: 11, font });
  if (branding.sign_name)
    page.drawText(String(branding.sign_name), { x: margin, y: 114, size: 11, font: fontBold });
  const meta = [branding.sign_role, branding.license].filter(Boolean).join(" · ");
  if (meta) page.drawText(meta, { x: margin, y: 100, size: 10, font });
}

function dataURLtoBytes(dataURL: string): Uint8Array {
  const base64 = dataURL.split(",")[1] || "";
  const bin = Buffer.from(base64, "base64");
  return new Uint8Array(bin);
}

/** Formatea líneas de la receta adaptándose a estructuras comunes */
function formatPrescriptionLines(d: any): string[] {
  const out: string[] = [];

  // Intentar lista de medicamentos-clásica
  const items = d?.items || d?.medications || d?.meds || [];
  if (Array.isArray(items) && items.length) {
    items.forEach((it: any, i: number) => {
      const name = it.name || it.drug || it.medicine || it.title || "Medicamento";
      const dose = it.dose || it.dosage || "";
      const freq = it.freq || it.frequency || "";
      const dur = it.duration || it.days || "";
      const instr = it.instructions || it.notes || it.indications || "";
      const parts = [name, dose, freq, dur].filter(Boolean).join(" · ");
      out.push(`${i + 1}. ${parts}`);
      if (instr) out.push(`   ${instr}`);
    });
  } else if (typeof d?.text === "string" && d.text.trim()) {
    // Texto libre
    d.text.split("\n").forEach((line: string) => out.push(line.trim()));
  } else if (Array.isArray(d?.lines)) {
    d.lines.forEach((line: any) => out.push(String(line)));
  } else {
    out.push("— Sin indicaciones —");
  }

  return out.slice(0, 60);
}

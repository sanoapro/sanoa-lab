// MODE: session (user-scoped, cookies)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonError, readOrgIdFromQuery } from "@/lib/http/validate";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const id = ctx.params.id;

  // Cargar receta
  let base = supa.from("prescriptions").select("*").eq("id", id).limit(1);
  const org = readOrgIdFromQuery(req);
  if (org.ok) base = base.eq("org_id", org.org_id);
  const { data: rx, error } = await base.single();
  if (error || !rx) return jsonError("NOT_FOUND", "Receta no encontrada", 404);

  // (Opcional) cargar paciente
  let patientName = "Paciente";
  if (rx.patient_id) {
    const { data: p } = await supa.from("patients").select("full_name").eq("id", rx.patient_id).maybeSingle();
    if (p?.full_name) patientName = p.full_name;
  }

  // Crear PDF simple
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const draw = (text: string, x: number, y: number, size = 12) => {
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
  };
  draw("RECETA MÉDICA", 50, 800, 18);
  draw(`Folio: ${rx.folio ?? rx.id}`, 50, 780, 10);
  draw(`Paciente: ${patientName}`, 50, 760, 12);
  draw(`Fecha: ${new Date(rx.created_at ?? Date.now()).toLocaleString()}`, 50, 740, 10);
  draw("Indicaciones:", 50, 710, 12);
  const content = typeof rx.content === "string" ? rx.content : JSON.stringify(rx.content ?? {}, null, 2);
  const lines = content.split("\n").slice(0, 40);
  lines.forEach((ln: string, i: number) => draw(ln.slice(0, 95), 50, 690 - i * 14, 10));
  draw("Firma:", 50, 120, 12);
  if (rx.signature_name) draw(`${rx.signature_name}`, 95, 120, 12);

  const bytes = await pdf.save();
  const filename = `receta_${id}.pdf`;
  const res = new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
  return res;
}

// MODE: session (user-scoped, cookies)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonError, readOrgIdFromQuery } from "@/lib/http/validate";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const id = ctx.params.id;

  let q = supa.from("discharges").select("*").eq("id", id).limit(1);
  const org = readOrgIdFromQuery(req);
  if (org.ok) q = q.eq("org_id", org.org_id);

  const { data: dc, error } = await q.single();
  if (error || !dc) return jsonError("NOT_FOUND", "Alta no encontrada", 404);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawText("ALTA MÉDICA", { x: 50, y: 800, size: 18, font, color: rgb(0, 0, 0) });
  page.drawText(`Folio: ${dc.folio ?? dc.id}`, { x: 50, y: 780, size: 10, font });
  page.drawText(`Fecha: ${new Date(dc.created_at ?? Date.now()).toLocaleString()}`, {
    x: 50,
    y: 760,
    size: 10,
    font,
  });

  const summary =
    typeof dc.summary === "string" ? dc.summary : JSON.stringify(dc.summary ?? {}, null, 2);

  summary
    .split("\n")
    .slice(0, 50)
    .forEach((ln: string, i: number) => {
      page.drawText(ln.slice(0, 95), { x: 50, y: 730 - i * 14, size: 10, font });
    });

  const bytes = await pdf.save();
  const filename = `alta_${id}.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}

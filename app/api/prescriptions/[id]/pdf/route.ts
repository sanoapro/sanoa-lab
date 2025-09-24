import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { newPdf, pngFromDataUrl, makeQrDataUrl, drawWrappedText } from "@/lib/pdf";

async function signedBuf(supabase: any, bucket: string, key: string) {
  const k = key.replace(new RegExp(`^${bucket}/`), "");
  const { data } = await supabase.storage.from(bucket).createSignedUrl(k, 60);
  if (!data?.signedUrl) return null;
  const r = await fetch(data.signedUrl);
  if (!r.ok) return null;
  return await r.arrayBuffer();
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const id = params.id;

  // Cabecera de receta
  const { data: rx } = await supabase
    .from("prescriptions")
    .select("id, org_id, patient_id, doctor_id, diagnosis, notes, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!rx) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const { data: items } = await supabase
    .from("prescription_items")
    .select("*")
    .eq("prescription_id", id)
    .order("id");

  const { data: pat } = await supabase
    .from("patients")
    .select("full_name, external_id")
    .eq("id", rx.patient_id)
    .maybeSingle();

  const { data: lh } = await supabase
    .from("doctor_letterheads")
    .select("*")
    .eq("org_id", rx.org_id)
    .eq("doctor_id", rx.doctor_id)
    .maybeSingle();

  // Disclaimer por tipo
  let footer = lh?.footer_disclaimer || "";
  if (!footer) {
    const { data: d } = await supabase
      .from("org_disclaimers")
      .select("text")
      .eq("org_id", rx.org_id)
      .eq("kind", "prescription")
      .maybeSingle();
    footer = d?.text || footer;
  }

  // Folio + verificación
  const { data: led } = await supabase.rpc("ensure_document_folio", {
    p_doc_type: "prescription",
    p_doc_id: id,
  });
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/docs/verify?type=prescription&id=${id}&code=${led.verify_code}`;
  const qrDataUrl = await makeQrDataUrl(verifyUrl);

  // PDF
  const { pdf, page, bold, W, H } = await newPdf();
  let y = H - 40;

  // Encabezado con logo y datos
  if (lh?.logo_url) {
    const ab = await signedBuf(supabase, "letterheads", lh.logo_url);
    if (ab) {
      const img = await pdf.embedPng(ab);
      const w = 120,
        h = (img.height / img.width) * w;
      page.drawImage(img, { x: 40, y: y - h + 8, width: w, height: h });
    }
  }
  page.setFont(bold);
  page.drawText(lh?.display_name || "Médico/a", { x: 180, y, size: 14 });
  y -= 16;
  if (lh?.credentials) {
    page.drawText(lh.credentials, { x: 180, y, size: 10 });
    y -= 12;
  }
  if (lh?.clinic_info) {
    page.drawText(lh.clinic_info, { x: 180, y, size: 10 });
    y -= 12;
  }

  // Folio/fecha
  page.drawText(`Folio: ${led.folio}`, { x: W - 160, y: H - 40, size: 10 });
  page.drawText(new Date(rx.created_at).toLocaleString(), { x: W - 160, y: H - 54, size: 10 });

  // Paciente
  y -= 8;
  page.drawText("Paciente:", { x: 40, y, size: 12 });
  y -= 14;
  page.drawText(`${pat?.full_name || rx.patient_id}`, { x: 40, y, size: 10 });
  y -= 12;
  if (pat?.external_id) {
    page.drawText(`ID: ${pat.external_id}`, { x: 40, y, size: 10 });
    y -= 12;
  }

  // Diagnóstico
  if (rx.diagnosis) {
    y -= 6;
    page.drawText("Diagnóstico:", { x: 40, y, size: 12 });
    y -= 14;
    y = drawWrappedText(page, rx.diagnosis, 40, y, W - 80, 10);
  }

  // Items
  y -= 6;
  page.drawText("Prescripción:", { x: 40, y, size: 12 });
  y -= 14;
  for (const it of items || []) {
    const line = `• ${it.drug}${it.dose ? ` ${it.dose}` : ""}${it.route ? ` ${it.route}` : ""}${it.frequency ? ` • ${it.frequency}` : ""}${it.duration ? ` • ${it.duration}` : ""}`;
    y = drawWrappedText(page, line, 40, y, W - 200, 10);
    if (it.instructions) y = drawWrappedText(page, `   ${it.instructions}`, 40, y, W - 200, 10);
    y -= 4;
  }

  // Firma y QR
  if (lh?.signature_url) {
    const ab = await signedBuf(supabase, "signatures", lh.signature_url);
    if (ab) {
      const img = await pdf.embedPng(ab);
      const w = 140,
        h = (img.height / img.width) * w;
      page.drawImage(img, { x: W - 40 - w, y: 90, width: w, height: h });
    }
  }
  const qr = await pngFromDataUrl(pdf, qrDataUrl);
  page.drawImage(qr, { x: W - 160, y: 40, width: 100, height: 100 });
  page.drawText("Verificar:", { x: W - 160, y: 144, size: 9 });
  page.drawText(verifyUrl.slice(0, 46), { x: W - 160, y: 132, size: 8 });
  if (verifyUrl.length > 46)
    page.drawText(verifyUrl.slice(46, 92), { x: W - 160, y: 122, size: 8 });

  // Pie
  if (footer) page.drawText(footer.slice(0, 300), { x: 40, y: 60, size: 9 });

  const bytes = await pdf.save();
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rx_${rx.id}.pdf"`,
    },
  });
}

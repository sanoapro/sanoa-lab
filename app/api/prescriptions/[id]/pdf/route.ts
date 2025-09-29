import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { newPdf, pngFromDataUrl, makeQrDataUrl, drawWrappedText } from "@/lib/pdf";

async function signedBuf(supabase: any, bucket: string, key: string) {
  const k = key.replace(new RegExp(`^${bucket}/`), "");
  const { data } = await supabase.storage.from(bucket).createSignedUrl(k, 60);
  if (!data?.signedUrl) return null;
  const r = await fetch(data.signedUrl);
  if (!r.ok) return null;
  return await r.arrayBuffer();
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabaseServer();
  const { data: au } = await supabase.auth.getUser();
  if (!au?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "html") {
    const origin = url.origin;
    const jsonUrl = `${origin}/api/prescriptions/${params.id}/json`;
    const res = await fetch(jsonUrl, {
      cache: "no-store",
      headers: { cookie: req.headers.get("cookie") || "" },
    });
    const j = await res.json();
    if (!j?.ok) {
      return NextResponse.json(j?.error || { code: "NOT_FOUND", message: "No encontrada" }, {
        status: res.status || 400,
      });
    }

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Receta ${params.id}</title>
<style>
  body{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto; color:#0f172a; }
  .sheet{ width: 800px; margin: 24px auto; }
  .row{ display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
  .h{ font-weight:600; font-size:18px; }
  .muted{ color:#64748b; font-size:12px; }
  .box{ border:1px solid #e2e8f0; border-radius:12px; padding:16px; }
  .items td{ padding:8px; border-bottom: 1px solid #e2e8f0; vertical-align: top;}
  .w-25{ width:25%; } .w-50{ width:50%; }
  img{ max-width:100%; }
</style>
</head>
<body>
  <div class="sheet">
    ${j.data.letterhead_path ? `<div class="box"><img src="${origin}/api/storage/letterheads/${encodeURIComponent(j.data.letterhead_path)}" alt="Membrete" /></div>` : ""}
    <div class="row" style="margin-top:16px">
      <div class="w-50">
        <div class="h">Receta</div>
        <div class="muted">Emitida: ${j.data.issued_at ? new Date(j.data.issued_at).toLocaleString() : "—"}</div>
        ${j.data.notes ? `<div class="muted" style="margin-top:4px">Notas: ${j.data.notes}</div>` : ""}
      </div>
      <div class="w-50" style="text-align:right">
        ${j.data.signature_path ? `<img style="max-height:80px" src="${origin}/api/storage/signatures/${encodeURIComponent(j.data.signature_path)}" alt="Firma" />` : ""}
        <div class="muted">Firma del especialista</div>
      </div>
    </div>
    <div class="box" style="margin-top:16px">
      <table class="items" style="width:100%; border-collapse:collapse;">
        <thead><tr><th class="w-25" style="text-align:left">Fármaco</th><th class="w-25" style="text-align:left">Dosis/Vía</th><th class="w-25" style="text-align:left">Frecuencia/Duración</th><th class="w-25" style="text-align:left">Indicaciones</th></tr></thead>
        <tbody>
          ${j.data.items.map((it: any)=>`<tr>
            <td><strong>${it.drug}</strong></td>
            <td>${it.dose || ""} ${it.route ? ` / ${it.route}` : ""}</td>
            <td>${it.freq || ""} ${it.duration? ` / ${it.duration}`:""}</td>
            <td>${it.instructions || ""}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </div>
</body></html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `inline; filename="receta-${params.id}.html"`,
      },
    });
  }

  const id = params.id;
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

  const { data: led } = await supabase.rpc("ensure_document_folio", {
    p_doc_type: "prescription",
    p_doc_id: id,
  });
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/docs/verify?type=prescription&id=${id}&code=${led.verify_code}`;
  const qrDataUrl = await makeQrDataUrl(verifyUrl);

  const { pdf, page, bold, W, H } = await newPdf();
  let y = H - 40;

  if (lh?.logo_url) {
    const ab = await signedBuf(supabase, "letterheads", lh.logo_url);
    if (ab) {
      const img = await pdf.embedPng(ab);
      const w = 120;
      const h = (img.height / img.width) * w;
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

  page.drawText(`Folio: ${led.folio}`, { x: W - 160, y: H - 40, size: 10 });
  page.drawText(new Date(rx.created_at).toLocaleString(), { x: W - 160, y: H - 54, size: 10 });

  y -= 8;
  page.drawText("Paciente:", { x: 40, y, size: 12 });
  y -= 14;
  page.drawText(`${pat?.full_name || rx.patient_id}`, { x: 40, y, size: 10 });
  y -= 12;
  if (pat?.external_id) {
    page.drawText(`ID: ${pat.external_id}`, { x: 40, y, size: 10 });
    y -= 12;
  }

  if (rx.diagnosis) {
    y -= 6;
    page.drawText("Diagnóstico:", { x: 40, y, size: 12 });
    y -= 14;
    y = drawWrappedText(page, rx.diagnosis, 40, y, W - 80, 10);
  }

  y -= 6;
  page.drawText("Prescripción:", { x: 40, y, size: 12 });
  y -= 14;
  for (const it of items || []) {
    const line = `• ${it.drug}${it.dose ? ` ${it.dose}` : ""}${it.route ? ` ${it.route}` : ""}${it.frequency ? ` • ${it.frequency}` : ""}${it.duration ? ` • ${it.duration}` : ""}`;
    y = drawWrappedText(page, line, 40, y, W - 200, 10);
    if (it.instructions) y = drawWrappedText(page, `   ${it.instructions}`, 40, y, W - 200, 10);
    y -= 4;
  }

  if (lh?.signature_url) {
    const ab = await signedBuf(supabase, "signatures", lh.signature_url);
    if (ab) {
      const img = await pdf.embedPng(ab);
      const w = 140;
      const h = (img.height / img.width) * w;
      page.drawImage(img, { x: W - 40 - w, y: 90, width: w, height: h });
    }
  }
  const qr = await pngFromDataUrl(pdf, qrDataUrl);
  page.drawImage(qr, { x: W - 160, y: 40, width: 100, height: 100 });
  page.drawText("Verificar:", { x: W - 160, y: 144, size: 9 });
  page.drawText(verifyUrl.slice(0, 46), { x: W - 160, y: 132, size: 8 });
  if (verifyUrl.length > 46) {
    page.drawText(verifyUrl.slice(46, 92), { x: W - 160, y: 122, size: 8 });
  }

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

import { NextRequest } from "next/server";
import { newPdf, pngFromDataUrl, makeQrDataUrl, drawWrappedText } from "@/lib/pdf";
import { badRequest, unauthorized, notFound, dbError, serverError } from "@/lib/api/responses";
import { getSupabaseServer } from "@/lib/supabase/server";

async function signedBuf(supabase: any, bucket: string, key: string) {
  const k = key.replace(new RegExp(`^${bucket}/`), "");
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(k, 60);
  if (error) throw error;
  if (!data?.signedUrl) return null;
  const r = await fetch(data.signedUrl);
  if (!r.ok) return null;
  return await r.arrayBuffer();
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabaseServer();

  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const orgId = new URL(req.url).searchParams.get("org_id");
    if (!orgId) {
      return badRequest("org_id requerido");
    }

    const { data: request, error: requestError } = await supabase
      .from("lab_requests")
      .select("*")
      .eq("id", params.id)
      .eq("org_id", orgId)
      .maybeSingle();

    if (requestError) {
      return dbError(requestError);
    }

    if (!request) {
      return notFound("Solicitud no encontrada");
    }

    const [{ data: items, error: itemsError }, { data: patient, error: patientError }] =
      await Promise.all([
        supabase.from("lab_request_items").select("*").eq("request_id", params.id).order("id"),
        supabase
          .from("patients")
          .select("full_name, external_id")
          .eq("id", request.patient_id)
          .maybeSingle(),
      ]);

    if (itemsError) {
      return dbError(itemsError);
    }

    if (patientError) {
      return dbError(patientError);
    }

    const { data: letterhead, error: letterheadError } = await supabase
      .from("doctor_letterheads")
      .select("*")
      .eq("org_id", request.org_id)
      .eq("doctor_id", request.requested_by)
      .maybeSingle();

    if (letterheadError) {
      return dbError(letterheadError);
    }

    let footer = letterhead?.footer_disclaimer || "";
    if (!footer) {
      const { data: disclaimer, error: disclaimerError } = await supabase
        .from("org_disclaimers")
        .select("text")
        .eq("org_id", request.org_id)
        .eq("kind", "labs")
        .maybeSingle();

      if (disclaimerError) {
        return dbError(disclaimerError);
      }

      footer = disclaimer?.text || footer;
    }

    const { data: ledger, error: ledgerError } = await supabase.rpc("ensure_document_folio", {
      p_doc_type: "lab_request",
      p_doc_id: params.id,
    });

    if (ledgerError) {
      return dbError(ledgerError);
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/docs/verify?type=lab_request&id=${params.id}&code=${
      ledger?.verify_code
    }`;
    const qrDataUrl = await makeQrDataUrl(verifyUrl);

    const { pdf, page, bold, W, H } = await newPdf();
    let y = H - 40;

    if (letterhead?.logo_url) {
      try {
        const ab = await signedBuf(supabase, "letterheads", letterhead.logo_url);
        if (ab) {
          const img = await pdf.embedPng(ab);
          const w = 120;
          const h = (img.height / img.width) * w;
          page.drawImage(img, { x: 40, y: y - h + 8, width: w, height: h });
        }
      } catch {
        // ignorar errores de logo
      }
    }

    page.setFont(bold);
    page.drawText(letterhead?.display_name || "Médico/a", { x: 180, y, size: 14 });
    y -= 16;
    if (letterhead?.credentials) {
      page.drawText(letterhead.credentials, { x: 180, y, size: 10 });
      y -= 12;
    }
    if (letterhead?.clinic_info) {
      page.drawText(letterhead.clinic_info, { x: 180, y, size: 10 });
      y -= 12;
    }
    if (ledger?.folio) {
      page.drawText(`Folio: ${ledger.folio}`, { x: W - 160, y: H - 40, size: 10 });
    }
    page.drawText(new Date(request.created_at).toLocaleString(), {
      x: W - 160,
      y: H - 54,
      size: 10,
    });

    y -= 8;
    page.drawText("Solicitud de estudios de laboratorio", { x: 40, y, size: 12 });
    y -= 14;
    page.drawText(`Paciente: ${patient?.full_name || request.patient_id}`, { x: 40, y, size: 10 });
    y -= 12;
    if (patient?.external_id) {
      page.drawText(`ID: ${patient.external_id}`, { x: 40, y, size: 10 });
      y -= 12;
    }
    if (request.title) {
      y = drawWrappedText(page, `Título: ${request.title}`, 40, y - 6, W - 80, 10);
    }
    if (request.instructions) {
      y = drawWrappedText(page, `Instrucciones: ${request.instructions}`, 40, y - 6, W - 80, 10);
    }
    if (request.due_at) {
      page.drawText(`Fecha límite: ${new Date(request.due_at).toLocaleString()}`, {
        x: 40,
        y: y - 6,
        size: 10,
      });
      y -= 18;
    }

    page.drawText("Estudios solicitados:", { x: 40, y, size: 12 });
    y -= 14;
    for (const item of items ?? []) {
      let line = `• ${item.test_name || "(sin nombre)"}`;
      if (item.test_code) line += ` [${item.test_code}]`;
      y = drawWrappedText(page, line, 40, y, W - 200, 10);
      if (item.notes) y = drawWrappedText(page, `   ${item.notes}`, 40, y, W - 200, 10);
      y -= 4;
    }

    if (letterhead?.signature_url) {
      try {
        const ab = await signedBuf(supabase, "signatures", letterhead.signature_url);
        if (ab) {
          const img = await pdf.embedPng(ab);
          const w = 140;
          const h = (img.height / img.width) * w;
          page.drawImage(img, { x: W - 40 - w, y: 90, width: w, height: h });
        }
      } catch {
        // ignorar errores de firma
      }
    }

    if (qrDataUrl) {
      const qr = await pngFromDataUrl(pdf, qrDataUrl);
      page.drawImage(qr, { x: W - 160, y: 40, width: 100, height: 100 });
      page.drawText("Verificar:", { x: W - 160, y: 144, size: 9 });
      page.drawText(verifyUrl.slice(0, 46), { x: W - 160, y: 132, size: 8 });
      if (verifyUrl.length > 46) {
        page.drawText(verifyUrl.slice(46, 92), { x: W - 160, y: 122, size: 8 });
      }
    }

    if (footer) {
      page.drawText(footer.slice(0, 300), { x: 40, y: 60, size: 9 });
    }

    const bytes = await pdf.save();

    return new Response(bytes as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lab_request_${request.id}.pdf"`,
        "Cache-Control": "private, max-age=0",
      },
    });
  } catch (err: any) {
    return serverError(err?.message ?? "Error generando PDF");
  }
}

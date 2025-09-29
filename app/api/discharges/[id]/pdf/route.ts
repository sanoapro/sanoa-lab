import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { badRequest, unauthorized, notFound, dbError, serverError } from "@/lib/api/responses";
import { newPdf, pngFromDataUrl, makeQrDataUrl, drawWrappedText } from "@/lib/pdf";

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

    const { data: discharge, error: dischargeError } = await supabase
      .from("discharges")
      .select("*")
      .eq("id", params.id)
      .eq("org_id", orgId)
      .maybeSingle();

    if (dischargeError) {
      return dbError(dischargeError);
    }

    if (!discharge) {
      return notFound("Alta no encontrada");
    }

    const [{ data: patient, error: patientError }, { data: letterhead, error: letterheadError }] = await Promise.all([
      supabase
        .from("patients")
        .select("full_name, external_id")
        .eq("id", discharge.patient_id)
        .maybeSingle(),
      supabase
        .from("doctor_letterheads")
        .select("*")
        .eq("org_id", discharge.org_id)
        .eq("doctor_id", discharge.doctor_id)
        .maybeSingle(),
    ]);

    if (patientError) {
      return dbError(patientError);
    }

    if (letterheadError) {
      return dbError(letterheadError);
    }

    let footer = letterhead?.footer_disclaimer || "";
    if (!footer) {
      const { data: disclaimer, error: disclaimerError } = await supabase
        .from("org_disclaimers")
        .select("text")
        .eq("org_id", discharge.org_id)
        .eq("kind", "discharge")
        .maybeSingle();

      if (disclaimerError) {
        return dbError(disclaimerError);
      }

      footer = disclaimer?.text || footer;
    }

    const { data: ledger, error: ledgerError } = await supabase.rpc("ensure_document_folio", {
      p_doc_type: "discharge",
      p_doc_id: params.id,
    });

    if (ledgerError) {
      return dbError(ledgerError);
    }

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/docs/verify?type=discharge&id=${params.id}&code=${
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
        // Ignorar errores de logo
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
    page.drawText(new Date(discharge.created_at).toLocaleString(), { x: W - 160, y: H - 54, size: 10 });

    y -= 8;
    page.drawText("Resumen de alta", { x: 40, y, size: 12 });
    y -= 14;
    page.drawText(`Paciente: ${patient?.full_name || discharge.patient_id}`, { x: 40, y, size: 10 });
    y -= 12;
    if (discharge.admission_at) {
      page.drawText(`Ingreso: ${new Date(discharge.admission_at).toLocaleString()}`, { x: 40, y, size: 10 });
      y -= 12;
    }
    if (discharge.discharge_at) {
      page.drawText(`Alta: ${new Date(discharge.discharge_at).toLocaleString()}`, { x: 40, y, size: 10 });
      y -= 12;
    }
    if (discharge.diagnosis) {
      y = drawWrappedText(page, `Diagnóstico: ${discharge.diagnosis}`, 40, y - 6, W - 80, 10);
    }
    if (discharge.summary) {
      y = drawWrappedText(page, `Resumen: ${discharge.summary}`, 40, y - 6, W - 80, 10);
    }
    if (discharge.recommendations) {
      y = drawWrappedText(page, `Recomendaciones: ${discharge.recommendations}`, 40, y - 6, W - 80, 10);
    }
    if (discharge.follow_up_at) {
      page.drawText(`Seguimiento: ${new Date(discharge.follow_up_at).toLocaleString()}`, {
        x: 40,
        y: y - 6,
        size: 10,
      });
      y -= 18;
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
        // Ignorar errores de firma
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
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="discharge_${discharge.id}.pdf"`,
        "Cache-Control": "private, max-age=0",
      },
    });
  } catch (err: any) {
    return serverError(err?.message ?? "Error generando PDF");
  }
}

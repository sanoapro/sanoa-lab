import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { newPdf, pngFromDataUrl, makeQrDataUrl, drawWrappedText } from "@/lib/pdf";

async function signedBuf(supabase:any, bucket:string, key:string){
  const k = key.replace(new RegExp(`^${bucket}/`), "");
  const { data } = await supabase.storage.from(bucket).createSignedUrl(k, 60);
  if (!data?.signedUrl) return null; const r = await fetch(data.signedUrl);
  if (!r.ok) return null; return await r.arrayBuffer();
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const id = params.id;
  const { data: dis } = await supabase.from("discharges").select("*").eq("id", id).maybeSingle();
  if (!dis) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const { data: pat } = await supabase.from("patients").select("full_name, external_id").eq("id", dis.patient_id).maybeSingle();
  const { data: lh } = await supabase.from("doctor_letterheads").select("*").eq("org_id", dis.org_id).eq("doctor_id", dis.doctor_id).maybeSingle();
  let footer = lh?.footer_disclaimer || "";
  if (!footer) { const { data: d } = await supabase.from("org_disclaimers").select("text").eq("org_id", dis.org_id).eq("kind","discharge").maybeSingle(); footer = d?.text || footer; }

  const { data: led } = await supabase.rpc("ensure_document_folio", { p_doc_type: "discharge", p_doc_id: id });
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL||""}/api/docs/verify?type=discharge&id=${id}&code=${led.verify_code}`;
  const qrDataUrl = await makeQrDataUrl(verifyUrl);

  const { pdf, page, bold, W, H } = await newPdf(); let y = H-40;

  if (lh?.logo_url) { const ab = await signedBuf(supabase, "letterheads", lh.logo_url); if (ab) { const img = await pdf.embedPng(ab); const w=120, h=(img.height/img.width)*w; page.drawImage(img,{x:40,y:y-h+8,width:w,height:h}); } }
  page.setFont(bold); page.drawText(lh?.display_name||"Médico/a",{x:180,y,size:14}); y-=16;
  if (lh?.credentials){ page.drawText(lh.credentials,{x:180,y,size:10}); y-=12; }
  if (lh?.clinic_info){ page.drawText(lh.clinic_info,{x:180,y,size:10}); y-=12; }
  page.drawText(`Folio: ${led.folio}`, { x: W-160, y: H-40, size: 10 });
  page.drawText(new Date(dis.created_at).toLocaleString(), { x: W-160, y: H-54, size: 10 });

  y-=8; page.drawText("Resumen de alta", { x: 40, y, size: 12 }); y-=14;
  page.drawText(`Paciente: ${pat?.full_name || dis.patient_id}`, { x: 40, y, size: 10 }); y-=12;
  if (dis.admission_at){ page.drawText(`Ingreso: ${new Date(dis.admission_at).toLocaleString()}`, { x: 40, y, size: 10 }); y-=12; }
  if (dis.discharge_at){ page.drawText(`Alta: ${new Date(dis.discharge_at).toLocaleString()}`, { x: 40, y, size: 10 }); y-=12; }
  if (dis.diagnosis){ y = drawWrappedText(page, `Diagnóstico: ${dis.diagnosis}`, 40, y-6, W-80, 10); }
  if (dis.summary){ y = drawWrappedText(page, `Resumen: ${dis.summary}`, 40, y-6, W-80, 10); }
  if (dis.recommendations){ y = drawWrappedText(page, `Recomendaciones: ${dis.recommendations}`, 40, y-6, W-80, 10); }
  if (dis.follow_up_at){ page.drawText(`Seguimiento: ${new Date(dis.follow_up_at).toLocaleString()}`, { x: 40, y: y-6, size: 10 }); y-=18; }

  if (lh?.signature_url) { const ab = await signedBuf(supabase,"signatures",lh.signature_url); if (ab){ const img = await pdf.embedPng(ab); const w=140,h=(img.height/img.width)*w; page.drawImage(img,{x:W-40-w,y:90,width:w,height:h}); } }
  const qr = await pngFromDataUrl(pdf, qrDataUrl); page.drawImage(qr,{ x: W-160, y: 40, width: 100, height: 100 });
  page.drawText("Verificar:",{x:W-160,y:144,size:9}); page.drawText(verifyUrl.slice(0,46),{x:W-160,y:132,size:8}); if (verifyUrl.length>46) page.drawText(verifyUrl.slice(46,92),{x:W-160,y:122,size:8});
  if (footer) page.drawText(footer.slice(0,300), { x: 40, y: 60, size: 9 });

  const bytes = await pdf.save();
  return new NextResponse(bytes, { status:200, headers:{ "Content-Type":"application/pdf", "Content-Disposition":`attachment; filename="discharge_${dis.id}.pdf"` } });
}

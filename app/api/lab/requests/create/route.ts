import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

function addHours(h:number){ return new Date(Date.now()+h*3600*1000).toISOString(); }

export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(()=> ({}));
  const { org_id, patient_id, email, title, instructions, items = [], due_at=null, token_hours=72 } = body;

  if (!org_id || !patient_id || !email || !title)
    return NextResponse.json({ error: "org_id, patient_id, email, title requeridos" }, { status: 400 });

  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // 1) Insert request
  const { data: reqRow, error: e1 } = await supa.from("lab_requests").insert({
    org_id, patient_id, requested_by: auth.user.id, title, instructions, status: "awaiting_upload", due_at
  }).select("id").single();
  if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });

  // 2) Items (opcionales)
  if (Array.isArray(items) && items.length) {
    const payload = items.map((t:any)=>({ request_id: reqRow!.id, test_code: t.code || null, test_name: t.name, notes: t.notes || null }));
    const { error: e2 } = await supa.from("lab_request_items").insert(payload);
    if (e2) return NextResponse.json({ error: e2.message }, { status: 400 });
  }

  // 3) Token
  const token = randomUUID().replace(/-/g,"") + randomUUID().replace(/-/g,"");
  const expires_at = addHours(Math.max(1, Number(token_hours)));
  const { error: e3 } = await supa.from("lab_upload_tokens").insert({ request_id: reqRow!.id, token, expires_at });
  if (e3) return NextResponse.json({ error: e3.message }, { status: 400 });

  // 4) Email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${appUrl}/portal/lab/upload?token=${encodeURIComponent(token)}`;
  const subj = "Solicitud de estudio de laboratorio — Sanoa";
  const html = `
  <div style="font-family:system-ui,sans-serif">
    <h2>Solicitud de laboratorio</h2>
    <p>Se te solicitó: <strong>${title}</strong></p>
    ${instructions ? `<p>${instructions}</p>` : ""}
    <p>Sube el resultado aquí:</p>
    <p><a href="${link}" style="background:#D97A66;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Subir estudio</a></p>
    <p>Este enlace expira el <strong>${new Date(expires_at).toLocaleString()}</strong>.</p>
  </div>`;

  const r = await fetch(`${appUrl}/api/mail/send`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ to: email, subject: subj, html }) });
  if (!r.ok) {
    const j = await r.json().catch(()=> ({}));
    return NextResponse.json({ error: j.error || "No se pudo enviar el correo" }, { status: 400 });
  }

  return NextResponse.json({ ok:true, request_id: reqRow!.id, link, expires_at });
}

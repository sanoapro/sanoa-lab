import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const supa = await getSupabaseServer();

  // Autenticación obligatoria
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const origin = new URL(req.url).origin;
  const jsonUrl = `${origin}/api/prescriptions/${params.id}/json`;

  // Reusamos el endpoint JSON interno y forwardeamos la cookie para mantener sesión
  const res = await fetch(jsonUrl, {
    cache: "no-store",
    headers: { cookie: req.headers.get("cookie") || "" },
  });

  const payload = await res.json().catch(() => null);
  if (!payload?.ok) {
    return NextResponse.json(
      payload?.error || { ok: false, error: { code: "NOT_FOUND", message: "No encontrada" } },
      { status: res.status || 400 }
    );
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
  @media print { .sheet{ margin:0 auto; } }
</style>
</head>
<body>
  <div class="sheet">
    ${payload.data.letterhead_path ? `<div class="box"><img src="${origin}/api/storage/letterheads/${encodeURIComponent(payload.data.letterhead_path)}" alt="Membrete" /></div>` : ""}
    <div class="row" style="margin-top:16px">
      <div class="w-50">
        <div class="h">Receta</div>
        <div class="muted">Emitida: ${payload.data.issued_at ? new Date(payload.data.issued_at).toLocaleString() : "—"}</div>
        ${payload.data.notes ? `<div class="muted" style="margin-top:4px">Notas: ${payload.data.notes}</div>` : ""}
      </div>
      <div class="w-50" style="text-align:right">
        ${payload.data.signature_path ? `<img style="max-height:80px" src="${origin}/api/storage/signatures/${encodeURIComponent(payload.data.signature_path)}" alt="Firma" />` : ""}
        <div class="muted">Firma del especialista</div>
      </div>
    </div>
    <div class="box" style="margin-top:16px">
      <table class="items" style="width:100%; border-collapse:collapse;">
        <thead><tr>
          <th class="w-25" style="text-align:left">Fármaco</th>
          <th class="w-25" style="text-align:left">Dosis/Vía</th>
          <th class="w-25" style="text-align:left">Frecuencia/Duración</th>
          <th class="w-25" style="text-align:left">Indicaciones</th>
        </tr></thead>
        <tbody>
          ${payload.data.items.map((it:any)=>`<tr>
            <td><strong>${it.drug}</strong></td>
            <td>${[it.dose, it.route].filter(Boolean).join(" / ")}</td>
            <td>${[it.freq || it.frequency, it.duration].filter(Boolean).join(" / ")}</td>
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

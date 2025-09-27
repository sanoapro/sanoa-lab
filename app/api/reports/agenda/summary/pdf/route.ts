// MODE: session (user-scoped, cookies)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { computeAgendaSummary, type Booking } from "@/lib/reports/agenda";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function fetchAll(origin: string, path: string, params: URLSearchParams) {
  const out: any[] = [];
  let page = 1, pageSize = 1000;
  while (page <= 20) {
    params.set("page", String(page)); params.set("pageSize", String(pageSize));
    const r = await fetch(`${origin}${path}?${params.toString()}`, { cache: "no-store" });
    const j = await r.json().catch(()=>null);
    const arr: any[] = Array.isArray(j) ? j : (j?.data ?? []);
    if (!arr?.length) break;
    out.push(...arr);
    if (arr.length < pageSize) break;
    page += 1;
  }
  return out;
}

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer | null> {
  try { const r = await fetch(url, { cache: "no-store" }); if (!r.ok) return null; return await r.arrayBuffer(); } catch { return null; }
}

export async function GET(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) return NextResponse.json({ ok:false, error:{ code:"UNAUTHORIZED", message:"No autenticado" }}, { status:401 });

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    const resource = url.searchParams.get("resource") ?? "";
    const tz = url.searchParams.get("tz") ?? "America/Mexico_City";
    const letterheadPath = url.searchParams.get("letterheadPath");
    if (!org_id || !from || !to) return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"org_id, from y to son requeridos" }}, { status:400 });

    // Datos
    const qp = new URLSearchParams({ org_id, from, to });
    if (resource) qp.set("resource", resource);
    const bookings: Booking[] = await fetchAll(url.origin, "/api/cal/bookings", qp);
    const summary = computeAgendaSummary(org_id, from, to, tz, bookings);

    // PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // Membrete
    if (letterheadPath) {
      const bytes = await fetchArrayBuffer(`${url.origin}/api/storage/letterheads/${letterheadPath}`);
      if (bytes) {
        try {
          let img: any;
          try { img = await pdf.embedPng(bytes); } catch { img = await pdf.embedJpg(bytes); }
          const maxW = width - 60, maxH = 120; const scale = Math.min(maxW / img.width, maxH / img.height);
          const w = img.width * scale, h = img.height * scale;
          page.drawImage(img, { x: (width - w) / 2, y: height - 40 - h, width: w, height: h });
        } catch {}
      }
    }

    let y = height - 170;
    const L = 40;

    page.drawText("Resumen de Agenda", { x: L, y, size: 18, font: bold }); y -= 22;
    page.drawText(`Periodo: ${from} → ${to}   •   TZ: ${tz}`, { x: L, y, size: 11, font }); y -= 18;

    const t = summary.totals;
    const lines = [
      `Total citas: ${t.total}`,
      `Completadas: ${t.completed}`,
      `No-show: ${t.no_show}`,
      `Canceladas: ${t.cancelled}`,
      `Otras: ${t.other}`,
      `Duración prom.: ${t.avg_duration_min} min`,
      `Lead-time prom.: ${t.avg_lead_time_h} h`,
    ];
    for (const s of lines) { page.drawText(s, { x: L, y, size: 11, font }); y -= 14; }

    // Tabla por día (multi-página si hace falta)
    y -= 8;
    const header = ["Fecha","Total","Comp.","No-show","Cancel","Otras","Dur (min)","Lead (h)"];
    const colX = [L, L+90, L+140, L+200, L+260, L+320, L+380, L+450];
    page.drawText(header[0], { x: colX[0], y, size: 11, font: bold });
    for (let i=1;i<header.length;i++) page.drawText(header[i], { x: colX[i], y, size: 11, font: bold });
    y -= 14;

    function ensureSpace(rowH = 14) {
      if (y < 60) {
        const p = pdf.addPage([595.28, 841.89]); y = p.getSize().height - 60;
        p.drawText("Resumen de Agenda (cont.)", { x: L, y, size: 12, font: bold }); y -= 18;
        // redraw header
        p.drawText(header[0], { x: colX[0], y, size: 11, font: bold });
        for (let i=1;i<header.length;i++) p.drawText(header[i], { x: colX[i], y, size: 11, font: bold });
        y -= 14;
        return p;
      }
      return page;
    }

    let currentPage = page;
    for (const d of summary.by_day) {
      if (y < 60) currentPage = ensureSpace();
      currentPage.drawText(d.date, { x: colX[0], y, size: 10, font });
      currentPage.drawText(String(d.total), { x: colX[1], y, size: 10, font });
      currentPage.drawText(String(d.completed), { x: colX[2], y, size: 10, font });
      currentPage.drawText(String(d.no_show), { x: colX[3], y, size: 10, font });
      currentPage.drawText(String(d.cancelled), { x: colX[4], y, size: 10, font });
      currentPage.drawText(String(d.other), { x: colX[5], y, size: 10, font });
      currentPage.drawText(String(d.avg_duration_min), { x: colX[6], y, size: 10, font });
      currentPage.drawText(String(d.avg_lead_time_h), { x: colX[7], y, size: 10, font });
      y -= 13;
    }

    // Página final: Top recursos
    const p2 = pdf.addPage([595.28, 841.89]);
    let yy = p2.getSize().height - 60;
    p2.drawText("Por recurso (Top 20)", { x: L, y: yy, size: 12, font: bold }); yy -= 18;
    const hdr2 = ["Recurso","Total","Comp.","No-show","Cancel","Otras"];
    const cx2 = [L, L+260, L+310, L+370, L+430, L+490];
    for (let i=0;i<hdr2.length;i++) p2.drawText(hdr2[i], { x: cx2[i], y: yy, size: 11, font: bold }); yy -= 14;
    for (const r of summary.by_resource.slice(0,20)) {
      p2.drawText(r.resource.slice(0,36), { x: cx2[0], y: yy, size: 10, font });
      p2.drawText(String(r.total), { x: cx2[1], y: yy, size: 10, font });
      p2.drawText(String(r.completed), { x: cx2[2], y: yy, size: 10, font });
      p2.drawText(String(r.no_show), { x: cx2[3], y: yy, size: 10, font });
      p2.drawText(String(r.cancelled), { x: cx2[4], y: yy, size: 10, font });
      p2.drawText(String(r.other), { x: cx2[5], y: yy, size: 10, font });
      yy -= 13;
      if (yy < 60) { yy = p2.getSize().height - 60; }
    }

    const bytes = await pdf.save();
    const filename = `agenda_resumen_${org_id}_${from}_${to}.pdf`;
    return new Response(bytes, { headers: {
      "Content-Type":"application/pdf",
      "Content-Disposition":`attachment; filename="${filename}"`,
      "Cache-Control":"no-store"
    }});
  } catch (e: any) {
    return NextResponse.json({ ok:false, error:{ code:"SERVER_ERROR", message: e?.message ?? "Error" }}, { status:500 });
  }
}

// MODE: session (user-scoped, cookies)
// GET /api/patients/[id]/pdf?org_id=<uuid>&letterheadPath=<path-opcional-en-bucket>
// Genera PDF con pdf-lib; intenta incorporar membrete desde /api/storage/letterheads/<path>
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user)
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
        { status: 401 },
      );

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    const customLetterheadPath = url.searchParams.get("letterheadPath"); // ej: <org_id>/current.png
    if (!org_id)
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } },
        { status: 400 },
      );

    // 1) Carga paciente
    const { data: patient, error } = await supa
      .from("v_patients")
      .select("id, org_id, name, gender, dob, tags, created_at")
      .eq("id", params.id)
      .eq("org_id", org_id)
      .single();

    if (error || !patient)
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Paciente no encontrado" } },
        { status: 404 },
      );

    // 2) PDF base
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // 3) Membrete (opcional)
    const origin = url.origin;
    let letterheadBytes: ArrayBuffer | null = null;
    if (customLetterheadPath) {
      letterheadBytes = await fetchArrayBuffer(
        `${origin}/api/storage/letterheads/${customLetterheadPath}`,
      );
    } else {
      // Convención por defecto: letterheads/<org_id>/letterhead.png
      letterheadBytes = await fetchArrayBuffer(
        `${origin}/api/storage/letterheads/${org_id}/letterhead.png`,
      );
    }
    if (letterheadBytes) {
      try {
        // Intentar PNG y luego JPG
        let img: any;
        try {
          img = await pdf.embedPng(letterheadBytes);
        } catch {
          img = await pdf.embedJpg(letterheadBytes);
        }
        const iw = img.width;
        const ih = img.height;
        const maxW = width - 60;
        const scale = Math.min(maxW / iw, 120 / ih);
        const drawW = iw * scale;
        const drawH = ih * scale;
        page.drawImage(img, {
          x: (width - drawW) / 2,
          y: height - 40 - drawH,
          width: drawW,
          height: drawH,
        });
      } catch {}
    }

    // 4) Título
    page.drawText("Resumen clínico del paciente", {
      x: 40,
      y: height - 180,
      size: 18,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // 5) Datos principales
    const y0 = height - 210;
    const L = 40;
    const LH = 18;
    const lines: [string, string][] = [
      ["Nombre", patient.name ?? "—"],
      ["Género", patient.gender ?? "—"],
      ["Fecha de nacimiento", patient.dob ?? "—"],
      ["Creado en", patient.created_at ? new Date(patient.created_at).toLocaleString() : "—"],
      ["Tags", Array.isArray(patient.tags) && patient.tags.length ? patient.tags.join(", ") : "—"],
      ["ID", (patient.id ?? "")],
    ];
    lines.forEach(([k, v]: any, i: any) => {
      const y = y0 - i * (LH + 6);
      page.drawText(`${k}:`, { x: L, y, size: 12, font: fontBold });
      page.drawText(String(v), { x: L + 160, y, size: 12, font });
    });

    // 6) Footer
    const footer = `Generado: ${new Date().toLocaleString()}  •  Org: ${org_id}`;
    page.drawText(footer, { x: 40, y: 30, size: 10, font, color: rgb(0.2, 0.2, 0.2) });

    const bytes = await pdf.save();
    const filename = `paciente_${patient.id}.pdf`;

    // ⚠️ Importante: envolver Uint8Array en Blob para evitar error de TS con Response
    const blob = new Blob([bytes], { type: "application/pdf" });

    return new Response(new Blob([blob]), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

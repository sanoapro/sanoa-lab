// /workspaces/sanoa-lab/app/api/export/paciente/[id]/csv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function escape(v: any) {
  return String(v ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/,/g, ";");
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabaseServer(); // ✅ await
  const patientId = params.id;

  const [
    { data: p, error: e1 },
    { data: notes, error: e2 },
    { data: appts, error: e3 },
    { data: pts, error: e4 },
  ] = await Promise.all([
    supabase.from("v_patients_export").select("*").eq("id", patientId).maybeSingle(),
    supabase
      .from("patient_notes")
      .select("id, created_at, titulo, contenido")
      .eq("patient_id", patientId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("patient_appointments")
      .select("cal_uid, title, status, start, end, meeting_url")
      .eq("patient_id", patientId)
      .order("start", { ascending: false }),
    supabase.from("patient_tags").select("tags(name)").eq("patient_id", patientId),
  ]);

  if (e1 || e2 || e3 || e4) {
    const err = e1?.message || e2?.message || e3?.message || e4?.message;
    return NextResponse.json({ error: err }, { status: 400 });
  }
  if (!p) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const tagsList = (pts ?? [])
    .map((r: any) => r.tags?.name)
    .filter(Boolean)
    .join(", ");

  const lines: string[] = [];
  lines.push("Seccion,Campo,Valor");
  lines.push(["Paciente", "ID", escape(p.id)].join(","));
  lines.push(["Paciente", "Nombre", escape(p.nombre)].join(","));
  lines.push(["Paciente", "Edad", escape(p.edad)].join(","));
  lines.push(["Paciente", "Genero", escape(p.genero)].join(","));
  lines.push(["Paciente", "Creado", escape(p.created_at)].join(","));
  lines.push(["Paciente", "Eliminado", escape(p.deleted_at)].join(","));
  lines.push(["Paciente", "Tags", escape(tagsList)].join(","));

  lines.push("");
  lines.push("Seccion,NotaID,Fecha,Titulo,Contenido");
  for (const n of notes ?? []) {
    lines.push(
      ["Nota", escape(n.id), escape(n.created_at), escape(n.titulo), escape(n.contenido)].join(","),
    );
  }

  lines.push("");
  lines.push("Seccion,UID,Inicio,Fin,Titulo,Estado,URL");
  for (const a of appts ?? []) {
    lines.push(
      [
        "Cita",
        escape(a.cal_uid),
        escape(a.start),
        escape(a.end),
        escape(a.title),
        escape(a.status),
        escape(a.meeting_url),
      ].join(","),
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(new Blob([csv]), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=paciente_${escape(p.nombre)}.csv`,
    },
  });
}

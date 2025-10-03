import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient, getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk } from "@/lib/api/responses";

const RxTemplate = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid().nullable().optional(),
  specialty: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  notes: z.string().optional().nullable(),
  is_reference: z.boolean().optional(),
});
const RxTemplateArray = z.array(RxTemplate);

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const org_id = searchParams.get("org_id") || null;

  let query = supa.from("rx_templates").select("*").order("updated_at", { ascending: false });
  if (org_id) query = query.eq("org_id", org_id);
  if (q) {
    // filtra por título/especialidad/cuerpo básico
    query = query.or(`title.ilike.%${q}%,specialty.ilike.%${q}%`);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return jsonOk({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parseSingle = () => RxTemplate.parse(body);
  const parseMany = () => RxTemplateArray.parse(body);

  const svc = createServiceClient();
  const rows = Array.isArray(body) ? parseMany() : [parseSingle()];

  // Genera IDs si faltan (lado cliente opcional)
  const withIds = rows.map((r: any) => ({ ...r, id: r.id ?? crypto.randomUUID() }));

  const { data, error } = await svc
    .from("rx_templates")
    .upsert(withIds, { onConflict: "id" })
    .select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return jsonOk({ items: data });
}

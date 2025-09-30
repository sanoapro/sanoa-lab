// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const BodySchema = z.object({
  org_id: z.string().uuid(),
  patient_ids: z.array(z.string().uuid()).min(1),
  provider_id: z.string().uuid().optional(), // default auth.uid()
  module: z.enum(["mente", "equilibrio", "sonrisa", "pulso", "general"]).default("general"),
  template_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(), // si ad-hoc
  content: z.any().optional(),                  // si ad-hoc
  due_at: z.string().datetime().optional(),
  frequency: z.enum(["once", "daily", "weekly", "monthly"]).default("once"),
  occurrences: z.coerce.number().int().min(1).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const body = await parseJson(req);
  const parsed = parseOrError(BodySchema, body);
  if (!parsed.ok) return jsonError(parsed.error.code, parsed.error.message, 400);

  const { data: me } = await supa.auth.getUser();
  const provider = parsed.data.provider_id ?? me?.user?.id ?? null;
  if (!provider) return jsonError("UNAUTHORIZED", "No provider", 401);

  // Si viene template_id y no viene title/content, obtén contenido de la plantilla
  let tplTitle: string | undefined = parsed.data.title;
  let tplContent: any = parsed.data.content;
  if (parsed.data.template_id && (!tplTitle || !tplContent)) {
    const { data: tpl, error: e } = await supa
      .from("work_templates")
      .select("title, content")
      .eq("id", parsed.data.template_id)
      .single();
    if (e) return jsonError("DB_ERROR", e.message, 400);
    tplTitle = tplTitle ?? tpl?.title ?? "Tarea";
    tplContent = tplContent ?? tpl?.content ?? {};
  }

  const rows = parsed.data.patient_ids.map(pid => ({
    org_id: parsed.data.org_id,
    patient_id: pid,
    provider_id: provider,
    module: parsed.data.module,
    template_id: parsed.data.template_id ?? null,
    title: tplTitle ?? parsed.data.title ?? "Tarea",
    content: tplContent ?? parsed.data.content ?? {},
    due_at: parsed.data.due_at ?? null,
    frequency: parsed.data.frequency,
    occurrences: parsed.data.occurrences ?? null,
    notes: parsed.data.notes ?? null,
    status: "active",
  }));

  const { data, error } = await supa
    .from("work_assignments")
    .insert(rows)
    .select("id");

  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk({ created: data?.length ?? 0, ids: data?.map(r => r.id) });
}

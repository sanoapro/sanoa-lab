// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

/**
 * GET /api/reminders/prefs?org_id=...&provider_id=...
 * POST /api/reminders/prefs  (upsert)
 */
const QuerySchema = z.object({
  org_id: z.string().uuid(),
  provider_id: z.string().uuid().optional(), // si no viene, se usa auth.uid()
});

const UpsertSchema = z.object({
  org_id: z.string().uuid(),
  provider_id: z.string().uuid().optional(), // default auth.uid()
  tz: z.string().min(1).default("America/Mexico_City"),
  window_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("09:00"),
  window_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("20:00"),
  days_of_week: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]), // 0=Domingo
  channels_priority: z.array(z.enum(["whatsapp", "sms"])).default(["whatsapp", "sms"]),
  max_retries: z.number().int().min(0).max(10).default(3),
  retry_backoff_min: z.number().int().min(1).max(240).default(30), // minutos
});

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const qp = new URL(req.url).searchParams;
  const parsed = QuerySchema.safeParse({
    org_id: qp.get("org_id"),
    provider_id: qp.get("provider_id") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i: any) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return jsonError("VALIDATION_ERROR", msg, 400);
  }

  const { data: me } = await supa.auth.getUser();
  const provider_id = parsed.data.provider_id ?? me?.user?.id ?? null;
  if (!provider_id) return jsonError("UNAUTHORIZED", "No provider", 401);

  const { data, error } = await supa
    .from("reminder_prefs")
    .select("*")
    .eq("org_id", parsed.data.org_id)
    .eq("provider_id", provider_id)
    .maybeSingle();
  if (error) return jsonError("DB_ERROR", error.message, 400);

  return jsonOk(
    data ?? {
      org_id: parsed.data.org_id,
      provider_id,
      tz: "America/Mexico_City",
      window_start: "09:00",
      window_end: "20:00",
      days_of_week: [1, 2, 3, 4, 5],
      channels_priority: ["whatsapp", "sms"],
      max_retries: 3,
      retry_backoff_min: 30,
    },
  );
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const raw = await parseJson(req);
  const parsed = parseOrError(UpsertSchema, raw);
  if (!parsed.ok) return jsonError(parsed.error.code, parsed.error.message, 400);

  const { data: me } = await supa.auth.getUser();
  const provider_id = parsed.data.provider_id ?? me?.user?.id ?? null;
  if (!provider_id) return jsonError("UNAUTHORIZED", "No provider", 401);

  const row = { ...parsed.data, provider_id };

  const { data, error } = await supa
    .from("reminder_prefs")
    .upsert(row, { onConflict: "org_id,provider_id" })
    .select("*")
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data);
}

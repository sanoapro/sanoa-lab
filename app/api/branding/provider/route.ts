// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

/**
 * GET /api/branding/provider?org_id=...&provider_id=...
 * POST /api/branding/provider  (upsert)
 */

const QuerySchema = z.object({
  org_id: z.string().uuid(),
  provider_id: z.string().uuid().optional(), // si no, se usa auth.uid()
});

const UpsertSchema = z.object({
  org_id: z.string().uuid(),
  provider_id: z.string().uuid().optional(), // default auth.uid()
  clinic_name: z.string().max(200).nullable().optional(),
  license_number: z.string().max(100).nullable().optional(),
  signature_name: z.string().max(200).nullable().optional(),
  letterhead_url: z.string().url().nullable().optional(),
  signature_url: z.string().url().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const qp = new URL(req.url).searchParams;

  const parsed = QuerySchema.safeParse({
    org_id: qp.get("org_id"),
    provider_id: qp.get("provider_id") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    return jsonError("VALIDATION_ERROR", msg, 400);
  }

  const { data: me } = await supa.auth.getUser();
  const provider_id = parsed.data.provider_id ?? me?.user?.id ?? null;
  if (!provider_id) return jsonError("UNAUTHORIZED", "No provider", 401);

  const { data, error } = await supa
    .from("provider_branding")
    .select("*")
    .eq("org_id", parsed.data.org_id)
    .eq("provider_id", provider_id)
    .maybeSingle();
  if (error) return jsonError("DB_ERROR", error.message, 400);

  return jsonOk(data ?? {});
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
    .from("provider_branding")
    .upsert(row, { onConflict: "org_id,provider_id" })
    .select("*")
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data);
}

// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError } from "@/lib/http/validate";

const QuerySchema = z.object({
  q: z.string().trim().min(2, "Mínimo 2 caracteres"),
  org_id: z.string().uuid(),
  only_mine: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? true : v === "true")),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

/**
 * GET /api/patients/suggest?q=jo&org_id=...&only_mine=true&limit=10
 * Devuelve: [{ patient_id, display_name }]
 */
export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const qp = new URL(req.url).searchParams;

  const parsed = QuerySchema.safeParse({
    q: qp.get("q") || "",
    org_id: qp.get("org_id"),
    only_mine: qp.get("only_mine") || undefined,
    limit: qp.get("limit") || undefined,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    return jsonError("VALIDATION_ERROR", msg, 400);
  }

  const { data: me, error: eUser } = await supa.auth.getUser();
  if (eUser || !me?.user?.id) return jsonError("UNAUTHORIZED", "Sin sesión", 401);

  const params = {
    q: parsed.data.q,
    org: parsed.data.org_id,
    provider: me.user.id,
    only_mine: parsed.data.only_mine,
    limit_n: parsed.data.limit,
  };

  const { data, error } = await supa.rpc("patients_suggest", params);
  if (error) return jsonError("DB_ERROR", error.message, 400);

  return jsonOk(data ?? []);
}

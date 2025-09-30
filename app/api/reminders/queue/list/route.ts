// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError } from "@/lib/http/validate";

const Query = z.object({
  org_id: z.string().uuid(),
  status: z.enum(["scheduled", "retrying", "sent", "failed", "canceled"]).optional(),
  limit: z.coerce.number().min(1).max(200).default(100),
  offset: z.coerce.number().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const qp = new URL(req.url).searchParams;

  const parsed = Query.safeParse({
    org_id: qp.get("org_id"),
    status: qp.get("status") || undefined,
    limit: qp.get("limit") || undefined,
    offset: qp.get("offset") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return jsonError("VALIDATION_ERROR", msg, 400);
  }

  let q = supa
    .from("reminder_queue")
    .select(
      "id, org_id, assignment_id, channel, template_slug, status, attempt_count, next_attempt_at, sent_at, last_error, created_at, payload",
    )
    .eq("org_id", parsed.data.org_id)
    .order("created_at", { ascending: false })
    .range(parsed.data.offset, parsed.data.offset + parsed.data.limit - 1);

  if (parsed.data.status) q = q.eq("status", parsed.data.status);

  const { data, error, count } = await q;
  if (error) return jsonError("DB_ERROR", error.message, 400);

  return jsonOk(data ?? [], {
    page: Math.floor(parsed.data.offset / parsed.data.limit) + 1,
    pageSize: parsed.data.limit,
    total: count ?? undefined,
  });
}

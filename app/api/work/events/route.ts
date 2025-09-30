// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const BodySchema = z.object({
  org_id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  kind: z.enum(["completed", "note", "skipped"]),
  payload: z.any().optional(),
});

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const body = await parseJson(req);
  const parsed = parseOrError(BodySchema, body);
  if (!parsed.ok) return jsonError(parsed.error.code, parsed.error.message, 400);

  const { data: me } = await supa.auth.getUser();
  const actor = me?.user?.id ?? null;

  const { error: e1 } = await supa.from("work_events").insert({
    org_id: parsed.data.org_id,
    assignment_id: parsed.data.assignment_id,
    kind: parsed.data.kind,
    payload: parsed.data.payload ?? {},
    created_by: actor,
  });
  if (e1) return jsonError("DB_ERROR", e1.message, 400);

  // Si es completado, marca en assignment
  if (parsed.data.kind === "completed") {
    const { error: e2 } = await supa
      .from("work_assignments")
      .update({ last_done_at: new Date().toISOString(), status: "completed" })
      .eq("id", parsed.data.assignment_id);
    if (e2) return jsonError("DB_ERROR", e2.message, 400);
  }

  return jsonOk({ logged: true });
}

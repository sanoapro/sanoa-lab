import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ok, unauthorized, badRequest, forbidden, dbError, serverError } from "@/lib/api/responses";
import { userBelongsToOrg } from "@/lib/api/orgs";

const createSchema = z.object({
  org_id: z.string().min(1, "org_id requerido"),
  name: z.string().min(1, "name requerido"),
  body: z.record(z.any()).default({}),
  doctor_scope: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();

  try {
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    if (!orgId) {
      return badRequest("org_id requerido");
    }

    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("page_size") || 20)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const allowed = await userBelongsToOrg(supa, orgId, auth.user.id);
    if (!allowed) {
      return forbidden("Sin acceso a la organización");
    }

    const { data, error, count } = await supa
      .from("discharge_templates")
      .select("*", { count: "exact" })
      .eq("org_id", orgId)
      .or(`doctor_id.is.null,doctor_id.eq.${auth.user.id}`)
      .order("doctor_id", { ascending: false })
      .range(from, to);

    if (error) {
      return dbError(error);
    }

    return ok({
      items: data ?? [],
      meta: { page, pageSize, total: count ?? 0 },
    });
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();

  try {
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const json = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Payload inválido", { details: parsed.error.flatten() });
    }

    const body = parsed.data;
    const allowed = await userBelongsToOrg(supa, body.org_id, auth.user.id);
    if (!allowed) {
      return forbidden("Sin acceso a la organización");
    }

    const doctorScope = body.doctor_scope ?? true;
    const payload = {
      org_id: body.org_id,
      doctor_id: doctorScope ? auth.user.id : null,
      name: body.name,
      body: body.body,
    };

    const { data, error } = await supa
      .from("discharge_templates")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return dbError(error);
    }

    return ok({ item: data });
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

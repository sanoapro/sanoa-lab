import { NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { ok, badRequest, serverError, error as jsonError } from "@/lib/api/responses";

const bucket = process.env.LAB_RESULTS_BUCKET || "lab-results";
const schema = z.object({
  path: z.string().min(1, "path requerido"),
  expires: z.coerce.number().int().min(5).max(60 * 60 * 24).optional(),
});

export async function POST(req: NextRequest) {
  const supa = createServiceClient();

  try {
    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Payload inválido", { details: parsed.error.flatten() });
    }

    const { path, expires } = parsed.data;
    const ttl = expires ?? Number(process.env.NEXT_PUBLIC_SIGNED_URL_TTL || 300);
    const { data, error } = await supa.storage
      .from(bucket)
      .createSignedUrl(path, Math.max(5, Number(ttl)));

    if (error) {
      return jsonError("STORAGE_ERROR", error.message);
    }

    if (!data?.signedUrl) {
      return serverError("No se pudo generar URL firmada");
    }

    return ok({ url: data.signedUrl });
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  ok,
  unauthorized,
  dbError,
  serverError,
  error as jsonError,
  badRequest,
} from "@/lib/api/responses";
import { renderTransactionalEmail, toTextFallback } from "@/lib/mail/templates";

const payloadSchema = z.object({
  org_id: z.string().min(1, "org_id requerido"),
  patient_id: z.string().min(1, "patient_id requerido"),
  email: z.string().email("email inválido"),
  title: z.string().min(1, "title requerido"),
  instructions: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        code: z.string().optional().nullable(),
        name: z.string().min(1, "name requerido"),
        notes: z.string().optional().nullable(),
      }),
    )
    .optional(),
  due_at: z.string().optional().nullable(),
  token_hours: z.coerce
    .number()
    .int()
    .min(1)
    .max(24 * 14)
    .optional(),
});

function addHours(h: number) {
  return new Date(Date.now() + h * 3600 * 1000).toISOString();
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();

  try {
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const json = await req.json().catch(() => null);
    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Payload inválido", { details: parsed.error.flatten() });
    }

    const {
      org_id,
      patient_id,
      email,
      title,
      instructions,
      items = [],
      due_at = null,
      token_hours = 72,
    } = parsed.data;

    const { data: requestRow, error: insertError } = await supa
      .from("lab_requests")
      .insert({
        org_id,
        patient_id,
        requested_by: auth.user.id,
        title,
        instructions,
        status: "awaiting_upload",
        due_at,
      })
      .select("id")
      .single();

    if (insertError) {
      return dbError(insertError);
    }

    if (items.length) {
      const payload = items.map((item: any) => ({
        request_id: requestRow!.id,
        test_code: item.code || null,
        test_name: item.name,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supa.from("lab_request_items").insert(payload);
      if (itemsError) {
        return dbError(itemsError);
      }
    }

    const token = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
    const expires_at = addHours(token_hours);

    const { error: tokenError } = await supa
      .from("lab_upload_tokens")
      .insert({ request_id: requestRow!.id, token, expires_at });

    if (tokenError) {
      return dbError(tokenError);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const link = `${appUrl}/portal/lab/upload?token=${encodeURIComponent(token)}`;

    const titleMail = "Solicitud de estudio de laboratorio";
    const html = renderTransactionalEmail({
      title: titleMail,
      intro: "Te compartimos el enlace para subir tu resultado:",
      highlight: title + (instructions ? ` — ${instructions}` : ""),
      actionLabel: "Subir estudio",
      actionUrl: link,
      footerNote: `Este enlace expira el ${new Date(expires_at).toLocaleString()}.`,
      previewText: `${title} · Sube tu estudio`,
    });

    const text = toTextFallback({
      title: titleMail,
      intro: "Enlace para subir tu resultado",
      highlight: title + (instructions ? ` — ${instructions}` : ""),
      actionLabel: "Subir estudio",
      actionUrl: link,
      footerNote: `Expira: ${new Date(expires_at).toLocaleString()}`,
    });

    const res = await fetch(`${appUrl}/api/mail/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Solicitud de laboratorio — Sanoa",
        html,
        text,
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      return jsonError(
        "MAIL_ERROR",
        payload.error || "No se pudo enviar el correo",
        res.status || 400,
      );
    }

    return ok({ request_id: requestRow!.id, link, expires_at });
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

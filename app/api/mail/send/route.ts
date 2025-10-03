// /workspaces/sanoa-lab/app/api/mail/send/route.ts
import { NextResponse } from "next/server";

/**
 * Entrada:
 * {
 *   to: string | string[],
 *   subject: string,
 *   html?: string,
 *   text?: string,
 *   from?: string,       // opcional, si no: process.env.MAIL_FROM
 *   replyTo?: string     // opcional
 * }
 *
 * Env:
 * - RESEND_API_KEY (primario)
 * - SENDGRID_API_KEY (fallback)
 * - MAIL_FROM = "Sanoa <no-reply@send.sanoa.com.mx>"
 */

type Payload = {
  to?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

function ensureArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function parseFromNameEmail(s: string): { email: string; name?: string } {
  // "Nombre <correo@dominio>" | "correo@dominio"
  const m = s.match(/^\s*(.+?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { email: s.trim() };
}

export async function POST(req: Request) {
  let body: Payload = {};
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const to = ensureArray(body.to);
  const subject = body.subject?.trim();
  const html = body.html;
  const text = body.text;
  const fromHeader = (body.from || process.env.MAIL_FROM || "Sanoa <no-reply@example.com>").trim();
  const replyTo = body.replyTo;

  if (!to.length || !subject || (!html && !text)) {
    return NextResponse.json(
      { error: "Campos requeridos: to, subject y html o text." },
      { status: 400 },
    );
  }

  const errors: string[] = [];

  // 1) --- Resend (primario) ---
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromHeader, // Resend acepta string con "Nombre <email>"
          to,
          subject,
          html,
          text,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      });

      // Siempre intentamos leer respuesta para tener trazas útiles
      const raw = await res.text().catch(() => "");
      if (!res.ok) {
        console.warn("[mail] Resend falló", res.status, raw);
        errors.push(`Resend ${res.status}: ${raw || "sin detalle"}`);
      } else {
        // Resend typical success: { id: "email_..." }
        let id: string | undefined;
        try {
          const j = raw ? JSON.parse(raw) : {};
          id = j?.id;
        } catch {}
        return NextResponse.json({ ok: true, provider: "resend", id: id || null });
      }
    } catch (e: any) {
      console.warn("[mail] Resend lanzó excepción:", e?.message || e);
      errors.push(`Resend exception: ${e?.message || String(e)}`);
    }
  } else {
    errors.push("Resend no configurado (RESEND_API_KEY ausente).");
  }

  // 2) --- SendGrid (fallback) ---
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (SENDGRID_API_KEY) {
    try {
      const { email, name } = parseFromNameEmail(fromHeader);
      const sgBody = {
        personalizations: [{ to: to.map((x: any) => ({ email: x })) }],
        from: name ? { email, name } : { email },
        subject,
        content: [{ type: html ? "text/html" : "text/plain", value: html || text }],
        ...(replyTo ? { reply_to: { email: replyTo } } : {}),
      };

      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sgBody),
      });

      const raw = await res.text().catch(() => "");
      if (!res.ok) {
        console.warn("[mail] SendGrid falló", res.status, raw);
        errors.push(`SendGrid ${res.status}: ${raw || "sin detalle"}`);
      } else {
        // SendGrid no siempre devuelve JSON; si hay header X-Message-Id lo tomamos
        const id = res.headers.get("x-message-id") || null;
        return NextResponse.json({ ok: true, provider: "sendgrid", id });
      }
    } catch (e: any) {
      console.warn("[mail] SendGrid lanzó excepción:", e?.message || e);
      errors.push(`SendGrid exception: ${e?.message || String(e)}`);
    }
  } else {
    errors.push("SendGrid no configurado (SENDGRID_API_KEY ausente).");
  }

  // 3) Ambos fallaron
  const detail = errors.join(" | ");
  return NextResponse.json({ error: "No fue posible enviar el correo.", detail }, { status: 502 });
}

export const GET = async () =>
  NextResponse.json({ ok: true, hint: "Usa POST con { to, subject, html/text }" });

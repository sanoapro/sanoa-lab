import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { to, subject, html, from: fromOverride } = await req.json().catch(() => ({}));

  if (!to || !subject || !html) {
    return NextResponse.json({ error: "to/subject/html requeridos" }, { status: 400 });
  }

  const toArray = Array.isArray(to) ? to : [to];
  const from = fromOverride || process.env.MAIL_FROM || "no-reply@example.com";

  // 1) Resend (si hay clave)
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: toArray, subject, html }),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return NextResponse.json({ error: `Resend: ${txt || r.statusText}` }, { status: 400 });
    }
    return NextResponse.json({ ok: true, provider: "resend" });
  }

  // 2) SendGrid (fallback actual)
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (!SENDGRID_API_KEY) {
    return NextResponse.json({ error: "No hay proveedor de email configurado (RESEND_API_KEY o SENDGRID_API_KEY)." }, { status: 400 });
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: toArray.map((e: string) => ({ email: e })) }],
      from: { email: from },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return NextResponse.json({ error: `SendGrid: ${txt || res.statusText}` }, { status: 400 });
  }
  return NextResponse.json({ ok: true, provider: "sendgrid" });
}

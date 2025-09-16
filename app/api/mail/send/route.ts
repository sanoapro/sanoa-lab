import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { to, subject, html } = await req.json().catch(() => ({}));
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.MAIL_FROM || "no-reply@example.com";

  if (!apiKey) return NextResponse.json({ error: "SENDGRID_API_KEY no configurado" }, { status: 400 });
  if (!to || !subject || !html) return NextResponse.json({ error: "to/subject/html requeridos" }, { status: 400 });

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: "text/html", value: html }]
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    return NextResponse.json({ error: `SendGrid: ${txt}` }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

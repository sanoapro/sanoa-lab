import { NextResponse } from "next/server";

type MailPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

// Pequeña utilidad para obtener el remitente
function getFrom() {
  return process.env.MAIL_FROM || "Sanoa Lab <no-reply@example.com>";
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as MailPayload | null;
  if (!body || !body.to || !body.subject) {
    return NextResponse.json({ error: "Faltan campos: to, subject" }, { status: 400 });
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const from = body.from || getFrom();

  // Modo DEV/STUB: si no hay API key, no enviamos nada: registramos y devolvemos ok.
  if (!SENDGRID_API_KEY) {
    // Nota: en Vercel/Edge/Node el console.log aparece en logs; en Codespaces, en la terminal.
    // Aquí podrías también guardarlo en una tabla "dev_mail_outbox" si quisieras persistirlo.
    console.log("DEV STUB EMAIL →", {
      to: body.to,
      subject: body.subject,
      from,
      html_len: body.html?.length ?? 0,
      text_len: body.text?.length ?? 0,
      at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, stub: true });
  }

  // Envío real (cuando hagas P5 y pongas SENDGRID_API_KEY)
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: body.to }] }],
      from: { email: from.match(/<(.*)>/)?.[1] || from }, // extrae email si viene en formato "Nombre <mail@...>"
      subject: body.subject,
      content: [
        body.html ? { type: "text/html", value: body.html } : { type: "text/plain", value: body.text || "" },
      ],
    }),
  });

  if (res.status === 202) {
    return NextResponse.json({ ok: true });
  } else {
    const err = await res.text().catch(() => "");
    return NextResponse.json({ error: `SendGrid error ${res.status}: ${err}` }, { status: 502 });
  }
}

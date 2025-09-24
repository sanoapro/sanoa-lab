export async function sendEmail(to: string, subject: string, text: string) {
  const res = await fetch("/api/notify/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ to, subject, text }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "No se pudo enviar email");
  }
}

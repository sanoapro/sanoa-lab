// /lib/mail/templates.ts
const BRAND = {
  name: "Sanoa",
  color: "#D97A66",
  text: "#0f172a",
  bluegray: "#334155",
  border: "#cbd5e1",
  bg: "#fff7f0",
};

export function renderTransactionalEmail(opts: {
  title: string;
  intro?: string;
  actionLabel?: string;
  actionUrl?: string;
  highlight?: string; // línea de énfasis (opcional)
  footerNote?: string; // nota al pie (opcional)
  previewText?: string; // texto de previsualización
}) {
  const {
    title,
    intro,
    actionLabel,
    actionUrl,
    highlight,
    footerNote = "Si no esperabas este correo, puedes ignorarlo.",
    previewText = title,
  } = opts;

  const cta =
    actionLabel && actionUrl
      ? `<p style="margin:22px 0 0">
           <a href="${actionUrl}"
              style="display:inline-block;background:${BRAND.color};color:#fff;
                     padding:12px 16px;border-radius:10px;text-decoration:none;font-weight:700">
             ${escapeHtml(actionLabel)}
           </a>
         </p>`
      : "";

  return `
<!doctype html>
<html lang="es">
<head>
  <meta charSet="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <style>
    /* Fuente del sistema para evitar bloqueos de imágenes/externos */
    body{margin:0;padding:0;background:${BRAND.bg};}
    .wrap{max-width:620px;margin:0 auto;padding:24px;}
    .card{
      background:#fff;border:1px solid ${BRAND.border};border-radius:16px;
      box-shadow:0 10px 25px rgba(34,25,23,.06);overflow:hidden
    }
    .hdr{padding:18px 22px;border-bottom:1px solid ${BRAND.border}}
    .ttl{margin:0;font:600 18px/1.2 system-ui,Segoe UI,Roboto,Helvetica,Arial}
    .body{padding:22px;font:400 15px/1.6 system-ui,Segoe UI,Roboto,Helvetica,Arial;color:${BRAND.text}}
    .muted{color:${BRAND.bluegray};font-size:13px}
    .hl{background:#fff4e8;border:1px solid #ffe3c9;color:${BRAND.text};
        padding:10px 12px;border-radius:10px;display:inline-block;font-weight:600}
    .ftr{padding:16px 22px;border-top:1px solid ${BRAND.border};background:#fffdf8}
    a{color:${BRAND.text}}
  </style>
</head>
<body>
  <span style="display:none!important;opacity:0;visibility:hidden;height:0;overflow:hidden">${escapeHtml(
    previewText,
  )}</span>
  <div class="wrap">
    <div class="card">
      <div class="hdr">
        <h1 class="ttl">${escapeHtml(title)}</h1>
      </div>
      <div class="body">
        ${intro ? `<p class="muted" style="margin-top:0">${escapeHtml(intro)}</p>` : ""}
        ${highlight ? `<div class="hl">${escapeHtml(highlight)}</div>` : ""}
        ${cta}
      </div>
      <div class="ftr">
        <p class="muted" style="margin:0">${escapeHtml(footerNote)}</p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();
}

export function toTextFallback(htmlIntent: {
  title: string;
  intro?: string;
  actionLabel?: string;
  actionUrl?: string;
  highlight?: string;
  footerNote?: string;
}) {
  const lines = [
    htmlIntent.title,
    htmlIntent.intro,
    htmlIntent.highlight ? `• ${htmlIntent.highlight}` : undefined,
    htmlIntent.actionLabel && htmlIntent.actionUrl
      ? `${htmlIntent.actionLabel}: ${htmlIntent.actionUrl}`
      : undefined,
    "",
    htmlIntent.footerNote,
  ]
    .filter(Boolean)
    .join("\n");
  return lines;
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

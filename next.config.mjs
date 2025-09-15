/** @type {import('next').NextConfig} */

// === Merge final ===
// - Conserva la intención original (CSP en Report-Only) durante desarrollo.
// - Añade CSP **estricto** en producción + HSTS + cabeceras de seguridad.
// - Incluye permisos para Supabase (HTTP + WebSocket) e imágenes remotas (logos/plantillas).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supaHost = (() => {
  try {
    return SUPABASE_URL ? new URL(SUPABASE_URL).host : "";
  } catch {
    return "";
  }
})();
const supaWs = supaHost ? `wss://${supaHost}` : "";
const isProd = process.env.NODE_ENV === "production";

function buildCSP() {
  const directives = [
    "default-src 'self'",
    // Next/Turbopack/Dev: permite eval en dev; se evita en prod
    ["script-src 'self'", !isProd && "'unsafe-eval'", "'wasm-unsafe-eval'"].filter(Boolean).join(" "),
    // Tailwind/estilos en línea de runtime
    "style-src 'self' 'unsafe-inline'",
    // Imágenes locales/remotas + data/blob
    "img-src 'self' data: blob: https:",
    // Conexiones salientes (Supabase HTTP + WS; CDNs que ya usabas; fonts.gstatic.com por preconnect)
    [
      "connect-src 'self'",
      supaHost && `https://${supaHost}`,
      supaWs,
      "https://*.supabase.co",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      "https://cdnjs.cloudflare.com",
      "https://fonts.gstatic.com",
    ].filter(Boolean).join(" "),
    // Fuentes
    "font-src 'self' https://fonts.gstatic.com data:",
    // Endurecimiento adicional
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Evita que tu app sea embebida (clickjacking). Si luego necesitas permitir cal.com, cambia a frame-ancestors 'self' y añade frame-src.
    "frame-ancestors 'none'",
    // Fuerza upgrade de http→https cuando sea posible
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

const securityHeaders = (() => {
  const arr = [
    isProd && { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ].filter(Boolean);

  // En desarrollo mantenemos Report-Only (como en tu config original) para facilitar depuración.
  if (!isProd) {
    arr.push({ key: "Content-Security-Policy-Report-Only", value: buildCSP() });
  } else {
    arr.push({ key: "Content-Security-Policy", value: buildCSP() });
  }
  return arr;
})();

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Permite logos remotos en exportaciones / render
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" }, // será actualizado a https por la directiva upgrade-insecure-requests
    ],
    dangerouslyAllowSVG: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

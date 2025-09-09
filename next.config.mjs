/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const cspReportOnly = [
      "default-src 'self'",
      // Dev y Next: eval para React refresh en dev; inline estilos por styled-jsx
      "script-src 'self' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // Imágenes y blobs (Twemoji SVG puede venir desde CDNs)
      "img-src 'self' data: blob: https:",
      // Conexiones a Supabase + CDNs y gstatic
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://fonts.gstatic.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
          { key: "Content-Security-Policy-Report-Only", value: cspReportOnly }
          // En producción HTTPS puedes activar HSTS:
          // { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;

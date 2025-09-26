// app/head.tsx
export default function Head() {
  // Puedes definir tu dominio público en .env:
  // NEXT_PUBLIC_SITE_URL=https://app.tu-dominio.com
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Preconnect a Supabase (si está configurado)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let supabaseOrigin: string | null = null;
  try {
    supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : null;
  } catch {
    supabaseOrigin = null;
  }

  return (
    <>
      {/* Codificación y viewport */}
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="light dark" />

      {/* Theme color (light/dark) */}
      <meta name="theme-color" content="#D97A66" media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content="#0B1220" media="(prefers-color-scheme: dark)" />

      {/* App name / PWA */}
      <meta name="application-name" content="Sanoa" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Sanoa" />
      <meta name="format-detection" content="telephone=no, address=no, email=no" />
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

      {/* Favicons */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/icons/icon-192.png" type="image/png" />
      <link rel="icon" href="/icons/icon-512.png" type="image/png" />

      {/* Canonical (si definiste NEXT_PUBLIC_SITE_URL) */}
      {siteUrl ? <link rel="canonical" href={siteUrl} /> : null}

      {/* Open Graph / Twitter (genérico; personaliza cuando tengas OG images) */}
      <meta property="og:site_name" content="Sanoa" />
      <meta property="og:type" content="website" />
      {siteUrl ? <meta property="og:url" content={siteUrl} /> : null}
      <meta property="og:title" content="Sanoa — Salud moderna y minimalista" />
      <meta
        property="og:description"
        content="Gestión clínica inteligente: pacientes, agenda, recordatorios y módulos Mente, Pulso, Sonrisa y Equilibrio."
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Sanoa — Salud moderna y minimalista" />
      <meta
        name="twitter:description"
        content="Gestión clínica inteligente: pacientes, agenda, recordatorios y módulos Mente, Pulso, Sonrisa y Equilibrio."
      />

      {/* Robots */}
      <meta name="robots" content="noindex, nofollow" />

      {/* Performance: preconnect/dns-prefetch a servicios externos que usamos */}
      <link rel="preconnect" href="https://cdn.segment.com" crossOrigin="" />
      <link rel="dns-prefetch" href="https://cdn.segment.com" />
      <link rel="preconnect" href="https://api.segment.io" crossOrigin="" />
      <link rel="dns-prefetch" href="https://api.segment.io" />
      <link rel="preconnect" href="https://js.stripe.com" crossOrigin="" />
      <link rel="dns-prefetch" href="https://js.stripe.com" />
      {supabaseOrigin ? (
        <>
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="" />
          <link rel="dns-prefetch" href={supabaseOrigin} />
        </>
      ) : null}
    </>
  );
}

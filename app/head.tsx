export default function Head() {
  return (
    <>
      {/* Theme color */}
      <meta name="theme-color" content="#D97A66" />

      {/* Manifest (Next sirve /manifest.webmanifest desde app/manifest.ts) */}
      <link rel="manifest" href="/manifest.webmanifest" />

      {/* iOS PWA */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Sanoa" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

      {/* Favicons básicos (si quieres más tamaños luego los agregamos) */}
      <link rel="icon" href="/favicon.ico" />
    </>
  );
}

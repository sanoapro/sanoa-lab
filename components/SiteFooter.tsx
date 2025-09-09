const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[var(--color-brand-border)] bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[var(--color-brand-bluegray)]">
          © {new Date().getFullYear()} Sanoa Lab · v{APP_VERSION}
        </p>
        <nav className="flex flex-wrap gap-3 text-[var(--color-brand-text)]/80">
          <a className="hover:underline" href="/acerca">Acerca</a>
          <a className="hover:underline" href="/privacidad">Privacidad</a>
          <a className="hover:underline" href="/terminos">Términos</a>
          <a className="hover:underline" href="/instalar">Instalar</a>
        </nav>
      </div>
    </footer>
  );
}

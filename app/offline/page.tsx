"use client";
import { useEffect, useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";

type CachedPage = { url: string; path: string };

export default function OfflinePage() {
  const [pages, setPages] = useState<CachedPage[]>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!("caches" in window)) {
          setChecking(false);
          return;
        }
        const names = await caches.keys();
        const found: CachedPage[] = [];
        for (const name of names) {
          const c = await caches.open(name);
          const reqs = await c.keys();
          for (const r of reqs) {
            try {
              const u = new URL(r.url);
              // Solo páginas de nuestro origen, sin assets técnicos
              const isOwn = u.origin === location.origin;
              const isPage = !u.pathname.startsWith("/_next/") && !u.pathname.startsWith("/icons/");
              if (isOwn && isPage) {
                const path = u.pathname + (u.search || "");
                if (!found.some((x) => x.path === path)) {
                  found.push({ url: u.href, path });
                }
              }
            } catch {}
          }
        }
        // Prioriza rutas “core”
        const order = ["/", "/dashboard", "/login", "/instalar"];
        found.sort((a, b) => {
          const ai = order.indexOf(a.path);
          const bi = order.indexOf(b.path);
          if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
          return a.path.localeCompare(b.path);
        });
        setPages(found.slice(0, 12));
      } catch {}
      setChecking(false);
    })();
  }, []);

  function retry() {
    location.reload();
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <section className="w-full max-w-2xl rounded-3xl border border-[var(--color-brand-border)] bg-white p-8 shadow space-y-5">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)] p-4">
            <ColorEmoji token="alerta" size={26} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[var(--color-brand-text)]">Sin conexión</h1>
            <p className="text-[var(--color-brand-bluegray)]">
              No pudimos cargar desde la red. Puedes intentar de nuevo o abrir una página disponible
              en caché.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={retry}
            className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 flex items-center gap-2"
          >
            <ColorEmoji token="refrescar" size={18} /> Reintentar
          </button>
          <a
            href="/dashboard"
            className="rounded-xl border border-[var(--color-brand-border)] px-4 py-2 hover:bg-[var(--color-brand-background)] flex items-center gap-2"
          >
            <ColorEmoji token="tablero" size={18} /> Ir al Tablero
          </a>
          <a
            href="/instalar"
            className="rounded-xl border border-[var(--color-brand-border)] px-4 py-2 hover:bg-[var(--color-brand-background)] flex items-center gap-2"
          >
            <ColorEmoji token="instalar" size={18} /> Instalar app
          </a>
        </div>

        <div>
          <h2 className="font-semibold text-[var(--color-brand-text)]">Páginas en caché</h2>
          {checking ? (
            <p className="text-sm text-[var(--color-brand-bluegray)] mt-2">Buscando…</p>
          ) : pages.length === 0 ? (
            <p className="text-sm text-[var(--color-brand-bluegray)] mt-2">
              Aún no hay páginas guardadas.
            </p>
          ) : (
            <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pages.map((p) => (
                <li key={p.url}>
                  <a
                    href={p.path}
                    className="block rounded-lg border border-[var(--color-brand-border)] bg-white px-3 py-2 text-sm hover:bg-[var(--color-brand-background)]"
                  >
                    {p.path}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

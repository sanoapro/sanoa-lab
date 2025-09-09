"use client";
import { useEffect, useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";

type BPEvent = any;

export default function InstalarPage() {
  const [promptEvt, setPromptEvt] = useState<BPEvent | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [isStandalone, setStandalone] = useState(false);
  const [ua, setUa] = useState({
    ios: false,
    android: false,
    desktop: false,
    chrome: false,
    safari: false,
    edge: false,
  });

  useEffect(() => {
    const nav = navigator as any;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true;
    setStandalone(standalone);

    const u = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(u);
    const android = /android/.test(u);
    const edge = /edg\//.test(u);
    const chrome = /chrome\//.test(u) && !edge;
    const safari = ios || (/safari/.test(u) && !chrome && !edge);
    setUa({ ios, android, desktop: !(ios || android), chrome, safari, edge });

    const handler = (e: any) => {
      e.preventDefault();
      setPromptEvt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function onInstallNow() {
    if (!promptEvt) return;
    promptEvt.prompt();
    const { outcome } = await promptEvt.userChoice.catch(() => ({ outcome: "dismissed" }));
    setChoice(outcome);
    setPromptEvt(null);
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center p-4">
      <section className="w-full max-w-3xl space-y-6">
        {/* Hero */}
        <div className="rounded-3xl border border-[var(--color-brand-border)] bg-white/95 p-6 md:p-8 shadow">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)] p-4">
              <ColorEmoji token="instalar" size={28} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight">
                Instalar Sanoa
              </h1>
              <p className="mt-1 text-[var(--color-brand-bluegray)]">
                Acceso desde tu pantalla de inicio, pantalla completa y uso offline básico.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isStandalone ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                    <ColorEmoji token="ok" size={16} /> Ya instalada
                  </span>
                ) : promptEvt ? (
                  <button
                    onClick={onInstallNow}
                    className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90"
                  >
                    Instalar ahora
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-border)] px-3 py-1 text-sm">
                    <ColorEmoji token="info" size={16} /> Sigue los pasos según tu dispositivo
                  </span>
                )}

                {choice && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-border)] bg-white px-3 py-1 text-sm">
                    Resultado: {choice === "accepted" ? "aceptado" : "descartado"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Guías por plataforma */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* iOS */}
          <article className="rounded-2xl border border-[var(--color-brand-border)] bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <ColorEmoji token="ios" size={18} /> iOS (Safari)
            </h2>
            <ol className="mt-3 list-decimal pl-5 text-sm text-[var(--color-brand-text)]/80 space-y-1.5">
              <li>
                Abre esta página en <strong>Safari</strong>.
              </li>
              <li>
                Toca <strong>Compartir</strong> <span aria-hidden>⬆️</span> en la barra.
              </li>
              <li>
                Elige <strong>Añadir a pantalla de inicio</strong>.
              </li>
              <li>
                Confirma con <strong>Añadir</strong>.
              </li>
            </ol>
            {ua.ios ? (
              <p className="mt-3 text-xs text-[var(--color-brand-bluegray)]">Detectado iOS.</p>
            ) : null}
          </article>

          {/* Android */}
          <article className="rounded-2xl border border-[var(--color-brand-border)] bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <ColorEmoji token="android" size={18} /> Android (Chrome)
            </h2>
            <ol className="mt-3 list-decimal pl-5 text-sm text-[var(--color-brand-text)]/80 space-y-1.5">
              <li>
                Toca el menú <strong>⋮</strong> de Chrome.
              </li>
              <li>
                Selecciona <strong>Instalar app</strong> o{" "}
                <strong>Añadir a pantalla de inicio</strong>.
              </li>
              <li>Confirma y acepta.</li>
            </ol>
            {ua.android ? (
              <p className="mt-3 text-xs text-[var(--color-brand-bluegray)]">Detectado Android.</p>
            ) : null}
          </article>

          {/* Desktop */}
          <article className="rounded-2xl border border-[var(--color-brand-border)] bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <ColorEmoji token="escritorio" size={18} /> Escritorio (Chrome/Edge)
            </h2>
            <ol className="mt-3 list-decimal pl-5 text-sm text-[var(--color-brand-text)]/80 space-y-1.5">
              <li>
                Busca el botón <strong>Instalar</strong> en la barra de direcciones.
              </li>
              <li>
                O en el menú del navegador, elige <strong>Instalar Sanoa</strong>.
              </li>
              <li>Confirma para abrirla en ventana propia.</li>
            </ol>
            {ua.desktop ? (
              <p className="mt-3 text-xs text-[var(--color-brand-bluegray)]">
                Detectado escritorio.
              </p>
            ) : null}
          </article>
        </div>
      </section>
    </main>
  );
}

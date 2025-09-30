// app/portal/lab/upload/page.tsx
"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { showToast } from "@/components/Toaster";

export default function PortalLabUploadPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] grid place-items-center p-6 text-[var(--color-brand-bluegray)]">
          Cargando…
        </main>
      }
    >
      <UploadClient />
    </Suspense>
  );
}

function UploadClient() {
  const params = useSearchParams();

  // Muchos webhooks/links usan ?token=... (o ?t=...)
  const token = useMemo(() => params.get("token") || params.get("t") || "", [params]);

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (!token) {
      showToast(
        { title: "Token faltante", description: "Abre el enlace completo del laboratorio." },
        "error",
      );
      return;
    }
    if (!file) {
      showToast(
        { title: "Archivo requerido", description: "Selecciona un PDF o imagen del resultado." },
        "error",
      );
      return;
    }

    try {
      setBusy(true);
      const fd = new FormData();
      fd.append("file", file, file.name);

      const res = await fetch(`/api/lab/upload?token=${encodeURIComponent(token)}`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudo subir el archivo.");
      }

      showToast({
        title: "Resultado cargado",
        description: "El laboratorio recibió tu archivo correctamente.",
        variant: "success",
      });

      setFile(null);
    } catch (err: any) {
      showToast({ title: "Error", description: String(err?.message || err) }, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-[var(--color-brand-border)] bg-white p-6 shadow">
        <header className="mb-4">
          <h1 className="text-lg font-semibold text-[var(--color-brand-text)]">
            Subir resultados de laboratorio
          </h1>
          {!token && (
            <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              No se encontró <code>token</code> en la URL. Abre el enlace que te enviaron del
              laboratorio o pide uno nuevo.
            </p>
          )}
        </header>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--color-brand-text)]">
              Archivo (PDF/JPG/PNG)
            </span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
              className="w-full rounded-xl border border-[var(--color-brand-border)] px-3 py-2"
              required
            />
          </label>

          <button
            type="submit"
            disabled={!token || !file || busy}
            data-loading={busy ? "1" : undefined}
            className="w-full rounded-xl bg-[var(--color-brand-bluegray)] px-4 py-3 text-white font-semibold transition-opacity disabled:opacity-60 data-[loading=1]:pointer-events-none"
          >
            {busy ? "Subiendo…" : "Subir archivo"}
          </button>
        </form>
      </section>
    </main>
  );
}

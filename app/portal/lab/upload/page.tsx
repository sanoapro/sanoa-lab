"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";

type ValidateResp =
  | { ok: true; request: { id: string; title: string }; expires_at: string }
  | { ok: false; error: string };

export default function LabUploadPortal() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const [state, setState] = useState<"loading" | "ready" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [reqInfo, setReqInfo] = useState<{ id: string; title: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const maxMB = useMemo(() => Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_MB || 10), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) {
        setState("error");
        setError("Falta el token en la URL.");
        return;
      }
      const r = await fetch(`/api/lab/upload?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      const j = (await r.json()) as ValidateResp;
      if (!alive) return;
      if (!j.ok) {
        setState("error");
        setError(j.error);
      } else {
        setReqInfo(j.request);
        setState("ready");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      showToast({ title: "Selecciona un archivo" });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("token", token);
      fd.append("file", file);
      if (notes) fd.append("notes", notes);

      const r = await fetch("/api/lab/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "No se pudo subir el archivo.");
      setState("done");
      showToast({ title: "Archivo recibido", variant: "success" });
    } catch (e: any) {
      const m = e?.message || "No se pudo subir el archivo.";
      setError(m);
      showToast({ title: "Error", description: m, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") {
    return (
      <main className="min-h-[100dvh] grid place-items-center p-6">
        <p className="text-[var(--color-brand-bluegray)]">Validando enlace…</p>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="min-h-[100dvh] grid place-items-center p-6">
        <section className="w-full max-w-lg rounded-2xl border border-[var(--color-brand-border)] bg-white p-6 shadow">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <ColorEmoji emoji="⚠️" /> Enlace no válido
          </h1>
          <p className="mt-2 text-sm text-[var(--color-brand-bluegray)]">{error}</p>
        </section>
      </main>
    );
  }

  if (state === "done") {
    return (
      <main className="min-h-[100dvh] grid place-items-center p-6">
        <section className="w-full max-w-lg rounded-2xl border border-[var(--color-brand-border)] bg-white p-6 shadow">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <ColorEmoji emoji="✅" /> Archivo recibido
          </h1>
          <p className="mt-2 text-sm text-[var(--color-brand-bluegray)]">
            ¡Gracias! Tu estudio fue cargado correctamente.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <section className="w-full max-w-lg rounded-2xl border border-[var(--color-brand-border)] bg-white p-6 shadow">
        <header className="mb-4">
          <h1 className="text-lg font-semibold text-[var(--color-brand-text)]">
            <span className="inline-flex items-center gap-2">
              <ColorEmoji token="laboratorio" /> Subir estudio
            </span>
          </h1>
          {reqInfo && (
            <p className="text-sm text-[var(--color-brand-bluegray)] mt-1">
              Solicitud: <strong>{reqInfo.title}</strong>
            </p>
          )}
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Archivo</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
            />
            <p className="mt-1 text-xs text-[var(--color-brand-bluegray)]">Máximo {maxMB} MB. PDF/JPG/PNG.</p>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Notas (opcional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              placeholder="Información adicional para el médico…"
            />
          </label>

          <button
            type="submit"
            disabled={!file || busy}
            className="w-full rounded-xl bg-[var(--color-brand-bluegray)] px-4 py-3 text-white font-semibold disabled:opacity-60"
          >
            {busy ? "Subiendo…" : "Subir archivo"}
          </button>
        </form>
      </section>
    </main>
  );
}

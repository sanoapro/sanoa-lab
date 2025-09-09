"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ColorEmoji from "@/components/ColorEmoji";

type FileRow = {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  metadata?: {
    size?: number;
    mimetype?: string;
    cacheControl?: string;
    lastModified?: string;
    contentLength?: number;
  } | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function MisArchivosPage() {
  const [files, setFiles] = useState<FileRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyName, setBusyName] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const bucket = "uploads";

  async function loadFiles() {
    setLoading(true);
    setMsg(null);

    // Importante: listará sólo lo que las RLS permitan (dueño).
    const { data, error } = await supabase.storage.from(bucket).list("", {
      limit: 1000,
      sortBy: { column: "updated_at", order: "desc" },
    });

    setLoading(false);
    if (error) {
      setMsg(error.message);
      setFiles([]);
      return;
    }
    setFiles(data as any);
  }

  useEffect(() => {
    loadFiles();
  }, []);

  function fmtBytes(n?: number) {
    if (!n && n !== 0) return "—";
    if (n < 1024) return `${n} B`;
    const kb = n / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  }

  async function handleView(name: string) {
    setBusyName(name);
    setMsg(null);
    try {
      // Descarga a blob (válido para privado) y abre en nueva pestaña
      const { data, error } = await supabase.storage.from(bucket).download(name);
      if (error) throw error;
      const blobUrl = URL.createObjectURL(data);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      // Limpieza diferida del blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (e: any) {
      setMsg(e?.message ?? "No se pudo abrir el archivo");
    } finally {
      setBusyName(null);
    }
  }

  async function handleDownload(name: string) {
    setBusyName(name);
    setMsg(null);
    try {
      const { data, error } = await supabase.storage.from(bucket).download(name);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = name.split("/").pop() || name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: any) {
      setMsg(e?.message ?? "No se pudo descargar");
    } finally {
      setBusyName(null);
    }
  }

  async function handleCopyLink(name: string) {
    setBusyName(name);
    setMsg(null);
    try {
      // URL firmada 10 minutos (600 s)
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(name, 600);
      if (error) throw error;
      await navigator.clipboard.writeText(data.signedUrl);
      setMsg("🔗 Enlace copiado (válido por 10 minutos).");
    } catch (e: any) {
      setMsg(e?.message ?? "No se pudo copiar el enlace");
    } finally {
      setBusyName(null);
    }
  }

  async function handleDelete(name: string) {
    if (!confirm("¿Eliminar este archivo? Esta acción no se puede deshacer.")) {
      return;
    }
    setBusyName(name);
    setMsg(null);
    try {
      const { error } = await supabase.storage.from(bucket).remove([name]);
      if (error) throw error;
      // Actualizamos localmente
      setFiles((prev) => (prev || []).filter((f) => f.name !== name));
      setMsg("🗑️ Archivo eliminado.");
    } catch (e: any) {
      setMsg(e?.message ?? "No se pudo eliminar");
    } finally {
      setBusyName(null);
    }
  }

  const isEmpty = useMemo(() => (files?.length ?? 0) === 0, [files]);

  return (
    <main className="p-6 md:p-10 space-y-8">
      {/* Encabezado */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
            <ColorEmoji token="carpeta" size={30} />
            Mis archivos
          </h1>
          <p className="text-[var(--color-brand-bluegray)]">
            Administra, visualiza y comparte tus documentos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/test-ui/upload"
            className="
              inline-flex items-center gap-2 rounded-2xl px-4 py-3
              bg-[var(--color-brand-primary)] text-white
              hover:brightness-95 active:brightness-90 transition shadow-sm
            "
          >
            <ColorEmoji token="subir" size={18} />
            Subir archivo
          </a>
          <button
            onClick={loadFiles}
            disabled={loading}
            className="
              inline-flex items-center gap-2 rounded-2xl px-4 py-3
              bg-white text-[var(--color-brand-text)]
              border border-[var(--color-brand-border)]
              hover:bg-[color-mix(in_oklab,white_90%,var(--color-brand-background)_10%)]
              transition
              disabled:opacity-60 disabled:cursor-not-allowed
            "
            title="Actualizar lista"
          >
            <ColorEmoji token="actualizar" size={18} />
            Actualizar lista
          </button>
        </div>
      </header>

      {/* Mensajes */}
      {msg && (
        <div
          className="
          rounded-2xl bg-white/95 border border-[var(--color-brand-border)]
          shadow-[0_10px_30px_rgba(0,0,0,0.06)] px-5 py-4 text-[var(--color-brand-text)]
        "
        >
          {msg}
        </div>
      )}

      {/* Estado cargando */}
      {loading && (
        <div
          className="
          rounded-3xl bg-white/90 border border-[var(--color-brand-border)]
          shadow-[0_10px_30px_rgba(0,0,0,0.06)] px-6 py-6
        "
        >
          <p className="text-[var(--color-brand-text)] flex items-center gap-2">
            <ColorEmoji token="info" size={18} /> Cargando…
          </p>
        </div>
      )}

      {/* Estado vacío */}
      {files && isEmpty && !loading && (
        <div
          className="
            rounded-3xl bg-white/95 border border-[var(--color-brand-border)]
            shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden
          "
        >
          <div className="p-7 flex items-start gap-4">
            <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="nube" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-[var(--color-brand-text)]">
                Aún no tienes archivos
              </h3>
              <p className="text-[var(--color-brand-bluegray)] mt-1">
                Sube tu primer documento para comenzar.
              </p>
              <div className="mt-4">
                <a
                  href="/test-ui/upload"
                  className="
                    inline-flex items-center gap-2 rounded-2xl px-4 py-3
                    bg-[var(--color-brand-primary)] text-white
                    hover:brightness-95 active:brightness-90 transition shadow-sm
                  "
                >
                  <ColorEmoji token="subir" size={18} />
                  Subir archivo
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {files && !isEmpty && !loading && (
        <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {files.map((f) => {
            const size = f.metadata?.size ?? (f.metadata?.contentLength as number | undefined);
            const shortName = f.name.split("/").pop() || f.name;

            return (
              <div
                key={f.name}
                className="
                  group rounded-3xl bg-white/95 border border-[var(--color-brand-border)]
                  shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)]
                  transition overflow-hidden
                "
              >
                <div className="p-6 flex items-start gap-4">
                  <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
                    <ColorEmoji token="archivo" size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[var(--color-brand-text)] font-semibold truncate">
                      {shortName}
                    </h3>
                    <p className="text-sm text-[var(--color-brand-bluegray)] mt-1">
                      {fmtBytes(size)} ·{" "}
                      {f.updated_at ? new Date(f.updated_at).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-[var(--color-brand-border)] mx-6" />

                <div className="p-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleView(f.name)}
                    disabled={busyName === f.name}
                    className="
                      inline-flex items-center gap-2 rounded-xl px-4 py-2
                      bg-white text-[var(--color-brand-text)]
                      border border-[var(--color-brand-border)]
                      hover:bg-[color-mix(in_oklab,white_90%,var(--color-brand-background)_10%)]
                      transition disabled:opacity-60
                    "
                    title="Ver"
                  >
                    <ColorEmoji token="ver" size={18} /> Ver
                  </button>

                  <button
                    onClick={() => handleDownload(f.name)}
                    disabled={busyName === f.name}
                    className="
                      inline-flex items-center gap-2 rounded-xl px-4 py-2
                      bg-white text-[var(--color-brand-text)]
                      border border-[var(--color-brand-border)]
                      hover:bg-[color-mix(in_oklab,white_90%,var(--color-brand-background)_10%)]
                      transition disabled:opacity-60
                    "
                    title="Descargar"
                  >
                    <ColorEmoji token="descargar" size={18} /> Descargar
                  </button>

                  <button
                    onClick={() => handleCopyLink(f.name)}
                    disabled={busyName === f.name}
                    className="
                      inline-flex items-center gap-2 rounded-xl px-4 py-2
                      bg-white text-[var(--color-brand-text)]
                      border border-[var(--color-brand-border)]
                      hover:bg-[color-mix(in_oklab,white_90%,var(--color-brand-background)_10%)]
                      transition disabled:opacity-60
                    "
                    title="Copiar enlace"
                  >
                    <ColorEmoji token="copiar" size={18} /> Copiar enlace
                  </button>

                  <button
                    onClick={() => handleDelete(f.name)}
                    disabled={busyName === f.name}
                    className="
                      inline-flex items-center gap-2 rounded-xl px-4 py-2
                      bg-[var(--color-brand-primary)] text-white
                      hover:brightness-95 active:brightness-90
                      transition disabled:opacity-60
                    "
                    title="Eliminar"
                  >
                    <ColorEmoji token="borrar" size={18} /> Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}

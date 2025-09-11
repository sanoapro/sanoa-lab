"use client";
import { useEffect, useRef, useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { showToast } from "@/components/Toaster";
import { getSignedUrl } from "@/lib/storage";

type Obj = {
  id?: string;
  name: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, any>;
};

const BUCKET = "uploads";

export default function UploadDemoPage() {
  const supabase = getSupabaseBrowser();
  const [files, setFiles] = useState<Obj[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasFiles = files.length > 0;

  const prettyDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  async function refreshList() {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list("", {
        limit: 1000,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" as const },
      });
      if (error) throw error;
      setFiles(data || []);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo obtener la lista.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshList();
  }, []);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      showToast("Elige un archivo primero.", "info");
      return;
    }
    setUploading(true);
    try {
      const path = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (error) throw error;
      showToast("Archivo subido.", "success");
      if (inputRef.current) inputRef.current.value = "";
      await refreshList();
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo subir el archivo.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function onCopyLink(obj: Obj) {
    try {
      const url = await getSignedUrl(obj.name, 300); // 5 minutos
      await navigator.clipboard.writeText(url);
      showToast("Enlace temporal copiado (5 min).", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo generar el enlace.", "error");
    }
  }

  async function onView(obj: Obj) {
    try {
      const url = await getSignedUrl(obj.name, 300);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      console.error(e);
      showToast("No se pudo abrir el archivo.", "error");
    }
  }

  async function onDownload(obj: Obj) {
    try {
      const url = await getSignedUrl(obj.name, 300);
      const a = document.createElement("a");
      a.href = url;
      a.download = obj.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      console.error(e);
      showToast("No se pudo descargar.", "error");
    }
  }

  async function onDelete(obj: Obj) {
    if (!confirm(`¿Eliminar "${obj.name}"?`)) return;
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([obj.name]);
      if (error) throw error;
      showToast("Archivo eliminado.", "success");
      await refreshList();
    } catch (e: any) {
      console.error(e);
      showToast("No se pudo eliminar.", "error");
    }
  }

  return (
    <main className="px-6 md:px-10 py-8 space-y-8">
      {/* Encabezado */}
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="documentos" size={28} />
          Subir & Gestionar archivos
        </h1>
        <p className="text-[var(--color-brand-bluegray)]">
          Bucket privado{" "}
          <code className="rounded px-1 bg-white/70 dark:bg-white/10 backdrop-blur">
            uploads
          </code>{" "}
          (RLS por dueño).
        </p>
      </header>

      {/* Uploader */}
      <section className="rounded-3xl border border-[var(--color-brand-border)] bg-white/80 dark:bg-white/[0.06] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-2">
            <span className="text-sm text-[var(--color-brand-text)]/80 flex items-center gap-2">
              <ColorEmoji token="subirBandeja" size={18} /> Archivo
            </span>
            <input
              ref={inputRef}
              type="file"
              className="block w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
            />
          </label>

          <form onSubmit={onUpload} className="sm:self-end">
            <button
              disabled={uploading}
              className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 flex items-center gap-2 h-10"
            >
              <ColorEmoji token="subir" size={18} />
              {uploading ? "Subiendo…" : "Subir"}
            </button>
          </form>

          <button
            onClick={refreshList}
            disabled={loading}
            className="rounded-xl border border-[var(--color-brand-border)] px-4 py-2 bg-white/50 dark:bg-white/[0.04] hover:bg-white/70 dark:hover:bg-white/[0.08] backdrop-blur flex items-center gap-2 h-10"
          >
            <ColorEmoji token="refrescar" size={18} />
            {loading ? "Actualizando…" : "Actualizar lista"}
          </button>
        </div>
      </section>

      {/* Lista */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {!hasFiles && !loading && (
          <div className="col-span-full rounded-2xl border border-[var(--color-brand-border)] bg-white/80 dark:bg-white/[0.06] backdrop-blur p-6 text-[var(--color-brand-bluegray)]">
            No hay archivos aún.
          </div>
        )}

        {files.map((obj) => (
          <article
            key={obj.name}
            className="group rounded-3xl border border-[var(--color-brand-border)] bg-white/80 dark:bg-white/[0.06] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition overflow-hidden"
          >
            <div className="p-6 flex items-start gap-4">
              <div className="rounded-2xl p-4 border border-[var(--color-brand-border)] bg-white/60 dark:bg-white/[0.06] backdrop-blur">
                <ColorEmoji token="archivo" size={24} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[var(--color-brand-text)] truncate">
                  {obj.name}
                </h3>
                <p className="text-sm text-[var(--color-brand-bluegray)]">
                  Actualizado: {prettyDate(obj.updated_at || obj.created_at)}
                </p>
              </div>
            </div>

            <div className="h-px bg-[var(--color-brand-border)] mx-6" />

            {/* Acciones: misma altura, sin cortes raros */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => onView(obj)}
                className="h-10 rounded-xl border border-[var(--color-brand-border)] px-3 bg-white/50 dark:bg-white/[0.04] hover:bg-white/70 dark:hover:bg-white/[0.08] backdrop-blur flex items-center justify-center gap-2 text-sm whitespace-nowrap"
              >
                <ColorEmoji token="ver" size={16} /> Ver
              </button>
              <button
                onClick={() => onDownload(obj)}
                className="h-10 rounded-xl border border-[var(--color-brand-border)] px-3 bg-white/50 dark:bg-white/[0.04] hover:bg-white/70 dark:hover:bg-white/[0.08] backdrop-blur flex items-center justify-center gap-2 text-sm whitespace-nowrap"
              >
                <ColorEmoji token="descargar" size={16} /> Descargar
              </button>
              <button
                onClick={() => onCopyLink(obj)}
                title="Signed URL (5 min)"
                className="h-10 rounded-xl border border-[var(--color-brand-border)] px-3 bg-white/50 dark:bg-white/[0.04] hover:bg-white/70 dark:hover:bg-white/[0.08] backdrop-blur flex items-center justify-center gap-2 text-sm whitespace-nowrap"
              >
                <ColorEmoji token="enlace" size={16} /> Copiar enlace
              </button>
              <button
                onClick={() => onDelete(obj)}
                className="h-10 rounded-xl border border-[var(--color-brand-border)] px-3 bg-white/50 dark:bg-white/[0.04] hover:bg-red-50 dark:hover:bg-red-900/20 backdrop-blur flex items-center justify-center gap-2 text-sm text-red-600 whitespace-nowrap"
              >
                <ColorEmoji token="borrar" size={16} /> Borrar
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
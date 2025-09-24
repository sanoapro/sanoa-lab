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

const BUCKET = process.env.NEXT_PUBLIC_UPLOADS_BUCKET || "lab-results";

export default function UploadDemoPage() {
  const supabase = getSupabaseBrowser();

  const [files, setFiles] = useState<Obj[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Prefijo (carpeta) para listar/subir. Ej: un request_id como "12345"
  const [prefix, setPrefix] = useState<string>(""); // vacío = raíz del bucket
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

  function fullKey(name: string) {
    return prefix ? `${prefix.replace(/\/+$/, "")}/${name}` : name;
  }

  async function refreshList() {
    setLoading(true);
    try {
      // Lista dentro del "prefix" (carpeta). Si está vacío, lista raíz.
      const { data, error } = await supabase.storage.from(BUCKET).list(prefix || "", {
        limit: 1000,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" as const },
      });
      if (error) throw error;

      // Filtra sólo archivos (algunas versiones devuelven carpetas con metadata null)
      const onlyFiles = (data || []).filter((x: any) => x && typeof x.name === "string");
      setFiles(onlyFiles);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo obtener la lista.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix]);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      showToast("Elige un archivo primero.", "info");
      return;
    }
    setUploading(true);
    try {
      const safePrefix = prefix.replace(/^\/+|\/+$/g, ""); // quita slashes sobrantes
      const base = `${Date.now()}-${file.name}`.replace(/[^\w.\-]+/g, "_");
      const path = safePrefix ? `${safePrefix}/${base}` : base;

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
      const key = fullKey(obj.name);
      // 5 minutos
      const url = await getSignedUrl(key, { bucket: BUCKET, expires: 300 });
      await navigator.clipboard.writeText(url);
      showToast("Enlace temporal copiado (5 min).", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo generar el enlace.", "error");
    }
  }

  async function onView(obj: Obj) {
    try {
      const key = fullKey(obj.name);
      const url = await getSignedUrl(key, { bucket: BUCKET, expires: 300 });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      console.error(e);
      showToast("No se pudo abrir el archivo.", "error");
    }
  }

  async function onDownload(obj: Obj) {
    try {
      const key = fullKey(obj.name);
      const url = await getSignedUrl(key, { bucket: BUCKET, expires: 300 });
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
      const key = fullKey(obj.name);
      const { error } = await supabase.storage.from(BUCKET).remove([key]);
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
          Importar archivos
        </h1>
        <p className="text-[var(--color-brand-bluegray)]">
          Bucket privado{" "}
          <code className="rounded px-1 bg-white/70 dark:bg-white/10 backdrop-blur">
            {BUCKET}
          </code>{" "}
          (usa carpeta/prefix para listar por solicitud, p. ej. <code>REQ123</code>).
        </p>
      </header>

      {/* Controles */}
      <section className="surface-light rounded-3xl border border-[var(--color-brand-border)] bg-white/80 dark:bg-white/[0.06] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6 grid gap-4 sm:grid-cols-3 sm:items-end">
          <label className="space-y-2">
            <span className="text-sm text-[var(--color-brand-text)]/80 flex items-center gap-2">
              <ColorEmoji token="carpeta" size={18} /> Carpeta (prefix)
            </span>
            <input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="Ej. REQ_abc123"
              className="block w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-[var(--color-brand-text)]/80 flex items-center gap-2">
              <ColorEmoji token="subirBandeja" size={18} /> Archivo
            </span>
            <input
              ref={inputRef}
              type="file"
              className="block w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
            />
          </label>

          <div className="flex gap-3">
            <form onSubmit={onUpload} className="sm:self-end">
              <button
                disabled={uploading}
                className="h-10 rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
              >
                <ColorEmoji token="subir" size={18} />
                {uploading ? "Subiendo…" : "Subir"}
              </button>
            </form>

            <button
              onClick={refreshList}
              disabled={loading}
              className="h-10 rounded-xl border border-[var(--color-brand-border)] px-4 py-2 bg-white/50 dark:bg-white/[0.04] hover:bg-white/70 dark:hover:bg-white/[0.08] backdrop-blur flex items-center gap-2"
            >
              <ColorEmoji token="refrescar" size={18} />
              {loading ? "Actualizando…" : "Actualizar"}
            </button>
          </div>
        </div>
      </section>

      {/* Lista */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {!hasFiles && !loading && (
          <div className="surface-light col-span-full rounded-2xl border border-[var(--color-brand-border)] bg-white/80 dark:bg-white/[0.06] backdrop-blur p-6 text-[var(--color-brand-bluegray)]">
            No hay archivos en esta carpeta.
          </div>
        )}

        {files.map((obj) => (
          <article
            key={obj.name}
            className="surface-light group rounded-3xl border border-[var(--color-brand-border)] bg-white/80 dark:bg-white/[0.06] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition overflow-hidden"
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

            {/* Acciones */}
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

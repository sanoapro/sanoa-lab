"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useToast } from "@/components/Toast";

type FileRow = {
  id?: string;
  name: string;
  updated_at?: string | null;
  created_at?: string | null;
  last_accessed_at?: string | null;
  metadata?: Record<string, any> | null;
};

export default function UploadPage() {
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState(false);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  // Obtener el UID para info visual (RLS ya lo usa por detrás)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSessionUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  const bucket = "uploads";

  async function listFiles() {
    setListing(true);
    const { data, error } = await supabase.storage.from(bucket).list("", {
      limit: 100,
      sortBy: { column: "updated_at", order: "desc" },
    });
    setListing(false);

    if (error) {
      toast({
        variant: "error",
        title: "No se pudo listar",
        description: error.message,
        emoji: "🛑",
      });
      return;
    }
    setFiles(data ?? []);
  }

  useEffect(() => {
    listFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openPicker() {
    inputRef.current?.click();
  }

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files;
    if (!picked || picked.length === 0) return;

    setLoading(true);
    try {
      for (const f of Array.from(picked)) {
        const filename = `${Date.now()}-${f.name}`;
        const { error } = await supabase.storage.from(bucket).upload(filename, f, {
          upsert: false, // evita sobrescritura accidental
          cacheControl: "3600",
        });
        if (error) {
          toast({
            variant: "error",
            title: "Error al subir",
            description: `${f.name}: ${error.message}`,
            emoji: "🛑",
          });
        } else {
          toast({
            variant: "success",
            title: "Archivo subido",
            description: f.name,
            emoji: "✅",
          });
        }
      }
      await listFiles();
    } finally {
      setLoading(false);
      // Limpia input para permitir subir el mismo archivo de nuevo si se quiere
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleCopySignedUrl(path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 10); // 10 min

    if (error || !data?.signedUrl) {
      toast({
        variant: "error",
        title: "No se pudo copiar el enlace",
        description: error?.message ?? "Sin URL",
        emoji: "🛑",
      });
      return;
    }
    await navigator.clipboard.writeText(data.signedUrl);
    toast({
      variant: "success",
      title: "Enlace temporal copiado",
      description: "Válido por 10 minutos.",
      emoji: "🔗",
    });
  }

  async function handleView(path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 5); // 5 min

    if (error || !data?.signedUrl) {
      toast({
        variant: "error",
        title: "No se pudo abrir",
        description: error?.message ?? "Sin URL",
        emoji: "🛑",
      });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleDownload(path: string) {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) {
      toast({
        variant: "error",
        title: "No se pudo descargar",
        description: error?.message ?? "—",
        emoji: "🛑",
      });
      return;
    }

    // Forzar descarga
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = path.split("/").pop() ?? "archivo";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast({
      variant: "info",
      title: "Descarga iniciada",
      description: a.download,
      emoji: "⬇️",
    });
  }

  async function handleDelete(path: string) {
    const ok = confirm("¿Eliminar este archivo? Esta acción no se puede deshacer.");
    if (!ok) return;

    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      toast({
        variant: "error",
        title: "No se pudo eliminar",
        description: error.message,
        emoji: "🛑",
      });
      return;
    }
    toast({
      variant: "success",
      title: "Archivo eliminado",
      description: path.split("/").pop() ?? "",
      emoji: "🗑️",
    });
    await listFiles();
  }

  const isEmpty = useMemo(() => files.length === 0, [files]);

  return (
    <main className="min-h-dvh bg-[var(--color-brand-background)] px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Encabezado */}
        <header
          className="
            rounded-3xl border border-[var(--color-brand-border)] bg-white/95 backdrop-blur
            shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6 md:p-8
          "
        >
          <div className="flex items-start md:items-center justify-between gap-6 flex-col md:flex-row">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] flex items-center gap-3">
                <span className="inline-grid place-content-center h-11 w-11 rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
                  <ColorEmoji emoji="📤" mode="duotone" />
                </span>
                Cargas
              </h1>
              <p className="mt-2 text-[var(--color-brand-bluegray)]">
                {sessionUserId ? (
                  <>
                    <ColorEmoji emoji="👤" mode="duotone" className="mr-1" /> Usuario:{" "}
                    <span className="font-medium text-[var(--color-brand-text)]">
                      {sessionUserId}
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openPicker}
                disabled={loading}
                className="
                  inline-flex items-center gap-2 px-4 py-3 rounded-2xl
                  bg-[var(--color-brand-primary)] text-white
                  hover:brightness-95 active:brightness-90
                  disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm
                "
                title="Subir archivos"
              >
                <ColorEmoji emoji="⤴️" mode="native" />
                <span>Subir archivos</span>
              </button>

              <button
                type="button"
                onClick={listFiles}
                disabled={listing}
                className="
                  inline-flex items-center gap-2 px-4 py-3 rounded-2xl
                  bg-white text-[var(--color-brand-text)]
                  border border-[var(--color-brand-border)]
                  hover:bg-[color-mix(in_oklab,#fff_80%,var(--color-brand-background)_20%)]
                  disabled:opacity-60 disabled:cursor-not-allowed transition
                "
                title="Actualizar lista"
              >
                <ColorEmoji emoji="🔄" mode="duotone" />
                <span>Actualizar lista</span>
              </button>

              <input
                ref={inputRef}
                type="file"
                multiple
                onChange={handlePick}
                className="hidden"
              />
            </div>
          </div>
        </header>

        {/* Lista */}
        <section
          className="
            rounded-3xl border border-[var(--color-brand-border)] bg-white/95 backdrop-blur
            shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-4 md:p-6
          "
        >
          {isEmpty ? (
            <div className="grid place-items-center py-16 text-center">
              <div className="inline-grid place-content-center h-16 w-16 rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)] mb-4">
                <ColorEmoji emoji="🗂️" mode="duotone" size={28} />
              </div>
              <p className="text-[var(--color-brand-text)] text-lg font-medium">
                Aún no tienes archivos
              </p>
              <p className="text-[var(--color-brand-bluegray)]">
                Usa <em>Subir archivos</em> para comenzar.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-brand-border)]">
              {files.map((f) => {
                const path = f.name; // estamos en raíz
                return (
                  <li
                    key={`${f.id ?? ""}:${f.name}`}
                    className="py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--color-brand-text)] truncate flex items-center gap-2">
                        <ColorEmoji emoji="📄" mode="duotone" />
                        {f.name}
                      </p>
                      <p className="text-sm text-[var(--color-brand-bluegray)]">
                        {f.updated_at
                          ? new Date(f.updated_at).toLocaleString()
                          : f.created_at
                          ? new Date(f.created_at).toLocaleString()
                          : "—"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-brand-border)] bg-white hover:bg-[var(--color-brand-background)]"
                        onClick={() => handleView(path)}
                        title="Ver"
                      >
                        <ColorEmoji emoji="👁️" mode="duotone" />
                        <span>Ver</span>
                      </button>
                      <button
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-brand-border)] bg-white hover:bg-[var(--color-brand-background)]"
                        onClick={() => handleDownload(path)}
                        title="Descargar"
                      >
                        <ColorEmoji emoji="⬇️" mode="native" />
                        <span>Descargar</span>
                      </button>
                      <button
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-brand-border)] bg-white hover:bg-[var(--color-brand-background)]"
                        onClick={() => handleCopySignedUrl(path)}
                        title="Copiar enlace"
                      >
                        <ColorEmoji emoji="🔗" mode="duotone" />
                        <span>Copiar enlace</span>
                      </button>
                      <button
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white hover:brightness-95"
                        onClick={() => handleDelete(path)}
                        title="Eliminar"
                      >
                        {/* Bote nativo como te gusta */}
                        <ColorEmoji emoji="🗑️" mode="native" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

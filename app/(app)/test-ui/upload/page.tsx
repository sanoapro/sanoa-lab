"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ColorEmoji from "@/components/ColorEmoji";
import { useToast } from "@/components/Toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ====================== helpers ====================== */

type FileRow = {
  name: string;
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
  last_accessed_at?: string | null;
  metadata?: { size?: number } | null;
};

type Tipo = "todos" | "imagen" | "pdf" | "audio" | "video" | "otros";

const IMG = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"]);
const PDF = new Set(["pdf"]);
const AUD = new Set(["mp3", "wav", "ogg", "m4a", "flac"]);
const VID = new Set(["mp4", "webm", "mov", "mkv", "avi"]);

function extOf(name: string) {
  const p = name.lastIndexOf(".");
  return p >= 0 ? name.slice(p + 1).toLowerCase() : "";
}
function tipoDe(name: string): Exclude<Tipo, "todos"> {
  const e = extOf(name);
  if (IMG.has(e)) return "imagen";
  if (PDF.has(e)) return "pdf";
  if (AUD.has(e)) return "audio";
  if (VID.has(e)) return "video";
  return "otros";
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}
function fmtBytes(n?: number) {
  if (!n && n !== 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

type SortValue =
  | "created_desc"
  | "created_asc"
  | "name_asc"
  | "name_desc"
  | "updated_desc"
  | "updated_asc";

const SORT_OPTS: { value: SortValue; label: string }[] = [
  { value: "created_desc", label: "Más recientes" },
  { value: "created_asc", label: "Más antiguos" },
  { value: "name_asc", label: "Nombre (A-Z)" },
  { value: "name_desc", label: "Nombre (Z-A)" },
  { value: "updated_desc", label: "Actualizados ↑" },
  { value: "updated_asc", label: "Actualizados ↓" },
];

function mapSort(v: SortValue): { column: "name" | "created_at" | "updated_at"; order: "asc" | "desc" } {
  switch (v) {
    case "created_asc":
      return { column: "created_at", order: "asc" };
    case "name_asc":
      return { column: "name", order: "asc" };
    case "name_desc":
      return { column: "name", order: "desc" };
    case "updated_desc":
      return { column: "updated_at", order: "desc" };
    case "updated_asc":
      return { column: "updated_at", order: "asc" };
    case "created_desc":
    default:
      return { column: "created_at", order: "desc" };
  }
}

/* ====================== página ====================== */

export default function UploadPage() {
  const { toast } = useToast();

  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [tipo, setTipo] = useState<Tipo>("todos");
  const [sort, setSort] = useState<SortValue>("created_desc");
  const [refreshKey, setRefreshKey] = useState(0);

  // debounce para el buscador
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function cargarLista() {
    setLoading(true);
    const { column, order } = mapSort(sort);
    const { data, error } = await supabase
      .storage
      .from("uploads")
      .list("", {
        limit: 200,
        search: debounced || undefined,
        sortBy: { column, order },
      });

    setLoading(false);

    if (error) {
      toast({
        variant: "error",
        title: "No se pudo cargar la lista",
        description: error.message,
      });
      return;
    }
    setFiles((data as any as FileRow[]) ?? []);
  }

  useEffect(() => {
    cargarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, sort, refreshKey]);

  // filtro por tipo (cliente)
  const filtered = useMemo(() => {
    if (tipo === "todos") return files;
    return files.filter((f) => tipoDe(f.name) === tipo);
  }, [files, tipo]);

  // subir archivo
  const inputRef = useRef<HTMLInputElement>(null);
  function clickUpload() {
    inputRef.current?.click();
  }
  async function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    const safeName = `${Date.now()}_${f.name}`.replace(/\s+/g, "_");
    const { error } = await supabase.storage.from("uploads").upload(safeName, f, {
      upsert: false,
    });
    if (error) {
      toast({ variant: "error", title: "Error al subir", description: error.message });
      return;
    }
    toast({ variant: "success", title: "Archivo subido", description: f.name });
    setRefreshKey((x) => x + 1);
    if (inputRef.current) inputRef.current.value = "";
  }

  // ver (preview en nueva pestaña con blob)
  async function handleVer(name: string) {
    const { data, error } = await supabase.storage.from("uploads").download(name);
    if (error || !data) {
      toast({ variant: "error", title: "No se pudo abrir", description: error?.message ?? "" });
      return;
    }
    const url = URL.createObjectURL(data);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  // descargar
  async function handleDescargar(name: string) {
    const { data, error } = await supabase.storage.from("uploads").download(name);
    if (error || !data) {
      toast({ variant: "error", title: "No se pudo descargar", description: error?.message ?? "" });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name.split("/").pop() || name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    toast({ variant: "success", title: "Descarga iniciada" });
  }

  // copiar enlace (firmado)
  async function handleCopiar(name: string) {
    const { data, error } = await supabase.storage.from("uploads").createSignedUrl(name, 60 * 60);
    if (error || !data?.signedUrl) {
      toast({ variant: "error", title: "No se pudo generar enlace", description: error?.message ?? "" });
      return;
    }
    await navigator.clipboard.writeText(data.signedUrl);
    toast({ variant: "success", title: "Enlace copiado", description: "Válido por 1 hora." });
  }

  // borrar
  async function handleBorrar(name: string) {
    const ok = window.confirm(`¿Borrar "${name}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    const { error } = await supabase.storage.from("uploads").remove([name]);
    if (error) {
      toast({ variant: "error", title: "No se pudo borrar", description: error.message });
      return;
    }
    toast({ variant: "success", title: "Archivo borrado" });
    setRefreshKey((x) => x + 1);
  }

  return (
    <main className="p-6 md:p-10 space-y-8">
      {/* Encabezado */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
            <ColorEmoji emoji="🗂️" mode="duotone" size={30} />
            Mis archivos
          </h1>
          <p className="text-[var(--color-brand-bluegray)]">
            Sube, visualiza, descarga, copia enlaces o elimina archivos. Todo con estilo Sanoa.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((x) => x + 1)}
            className="
              inline-flex items-center gap-2 rounded-2xl px-4 py-3
              border border-[var(--color-brand-border)] bg-white/90
              text-[var(--color-brand-text)] hover:brightness-95
              shadow-sm
            "
            title="Actualizar lista"
          >
            <ColorEmoji emoji="🔄" mode="native" />
            Actualizar lista
          </button>

          <button
            type="button"
            onClick={clickUpload}
            className="
              inline-flex items-center gap-2 rounded-2xl px-4 py-3
              bg-[var(--color-brand-primary)] text-white
              hover:brightness-95 active:brightness-90 shadow-sm
            "
            title="Subir archivo"
          >
            <ColorEmoji emoji="⬆️" mode="native" />
            Subir archivo
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={onSelectFile}
          />
        </div>
      </header>

      {/* Controles: búsqueda + filtros + orden */}
      <section
        className="
          w-full rounded-3xl bg-white/95 border border-[var(--color-brand-border)]
          shadow-[0_10px_30px_rgba(0,0,0,0.06)] px-5 md:px-7 py-5
        "
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Buscador */}
          <div className="relative w-full md:max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ColorEmoji emoji="🔎" mode="native" />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              className="
                w-full pl-9 pr-3 py-3 rounded-2xl border border-[var(--color-brand-border)]
                bg-white text-[var(--color-brand-text)]
                placeholder:text-[color-mix(in_oklab,var(--color-brand-bluegray)_75%,white)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]
              "
            />
          </div>

          {/* Orden */}
          <label className="inline-flex items-center gap-2">
            <span className="text-sm text-[var(--color-brand-bluegray)]">Ordenar por</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortValue)}
              className="
                rounded-xl border border-[var(--color-brand-border)]
                bg-white px-3 py-2 text-[var(--color-brand-text)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]
              "
            >
              {SORT_OPTS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Chips de tipo */}
        <div className="mt-4 flex flex-wrap gap-2">
          {(["todos", "imagen", "pdf", "audio", "video", "otros"] as Tipo[]).map((t) => {
            const active = tipo === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => setTipo(t)}
                className={`
                  inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm
                  border shadow-sm transition
                  ${active
                    ? "bg-[var(--color-brand-primary)] text-white border-transparent"
                    : "bg-white text-[var(--color-brand-text)] border-[var(--color-brand-border)] hover:brightness-95"}
                `}
              >
                <ColorEmoji
                  emoji={
                    t === "imagen" ? "🖼️" :
                    t === "pdf" ? "📄" :
                    t === "audio" ? "🎵" :
                    t === "video" ? "🎥" :
                    t === "otros" ? "📦" : "🗂️"
                  }
                  mode={t === "pdf" ? "native" : "duotone"}
                />
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            );
          })}
        </div>
      </section>

      {/* Lista */}
      <section className="min-h-[200px]">
        {loading ? (
          <div
            className="
              rounded-3xl bg-white/95 border border-[var(--color-brand-border)]
              shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-7 animate-pulse
            "
          >
            <div className="h-5 w-64 bg-[var(--color-brand-background)] rounded mb-3" />
            <div className="h-5 w-40 bg-[var(--color-brand-background)] rounded" />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="
              rounded-3xl bg-white/95 border border-[var(--color-brand-border)]
              shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-7
              text-[var(--color-brand-bluegray)]
            "
          >
            <div className="flex items-center gap-2">
              <ColorEmoji emoji="🫥" mode="native" />
              No hay archivos que coincidan.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((f) => {
              const tipo = tipoDe(f.name);
              const icon =
                tipo === "imagen" ? "🖼️" :
                tipo === "pdf" ? "📄" :
                tipo === "audio" ? "🎵" :
                tipo === "video" ? "🎥" :
                "📦";
              return (
                <article
                  key={f.name}
                  className="
                    rounded-3xl bg-white/95 border border-[var(--color-brand-border)]
                    shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden
                    flex flex-col
                  "
                >
                  {/* cabecera */}
                  <div className="px-5 py-4 border-b border-[var(--color-brand-border)] flex items-center gap-3">
                    <ColorEmoji emoji={icon} mode={icon === "📄" ? "native" : "duotone"} />
                    <div className="min-w-0">
                      <h3 className="text-[var(--color-brand-text)] font-medium truncate">{f.name}</h3>
                      <p className="text-xs text-[var(--color-brand-bluegray)]">
                        Creado: {fmtDate(f.created_at)} · Modificado: {fmtDate(f.updated_at)}
                      </p>
                    </div>
                  </div>

                  {/* acciones */}
                  <div className="px-5 py-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleVer(f.name)}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-white border border-[var(--color-brand-border)] hover:brightness-95"
                      title="Ver"
                    >
                      <ColorEmoji emoji="👁️" mode="native" />
                      Ver
                    </button>
                    <button
                      onClick={() => handleDescargar(f.name)}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-white border border-[var(--color-brand-border)] hover:brightness-95"
                      title="Descargar"
                    >
                      <ColorEmoji emoji="⬇️" mode="native" />
                      Descargar
                    </button>
                    <button
                      onClick={() => handleCopiar(f.name)}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-white border border-[var(--color-brand-border)] hover:brightness-95"
                      title="Copiar enlace"
                    >
                      <ColorEmoji emoji="🔗" mode="native" />
                      Copiar enlace
                    </button>
                    <div className="ml-auto" />
                    <button
                      onClick={() => handleBorrar(f.name)}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                      title="Borrar"
                    >
                      <ColorEmoji emoji="🗑️" mode="native" />
                      Borrar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

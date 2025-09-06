"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import UiCard from "@/components/UiCard";
import ColorEmoji from "@/components/ColorEmoji";

const BUCKET = "uploads";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Item = {
  name: string;
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export default function UploadPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setEmail(u?.email ?? null);
      setUserId(u?.id ?? null);
      if (u?.id) listFiles(u.id);
    });
  }, []);

  async function listFiles(uid: string) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(uid, { limit: 100, sortBy: { column: "name", order: "desc" } });
    if (error) {
      setInfo(`Error listando: ${error.message}`);
      return;
    }
    setItems(data ?? []);
  }

  async function handleUpload() {
    if (!userId || !file) return;
    setBusy(true);
    setInfo(null);
    const path = `${userId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    setBusy(false);

    if (error) {
      setInfo(`Error al subir: ${error.message}`);
      return;
    }
    alert("Archivo subido con éxito.");
    setFile(null);
    await listFiles(userId);
  }

  async function viewItem(name: string) {
    if (!userId) return;
    const path = `${userId}/${name}`;
    // URL firmada rápida para ver en nueva pestaña
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 120);
    if (error || !data) {
      setInfo(`No se pudo generar enlace: ${error?.message}`);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function downloadItem(name: string) {
    if (!userId) return;
    const path = `${userId}/${name}`;
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) {
      setInfo(`No se pudo descargar: ${error?.message}`);
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function copyLink(name: string) {
    if (!userId) return;
    const path = `${userId}/${name}`;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 600);
    if (error || !data) {
      setInfo(`No se pudo copiar enlace: ${error?.message}`);
      return;
    }
    await navigator.clipboard.writeText(data.signedUrl);
    setInfo("Enlace copiado al portapapeles.");
    setTimeout(() => setInfo(null), 2500);
  }

  async function removeItem(name: string) {
    if (!userId) return;
    if (!confirm("¿Eliminar este archivo?")) return;
    const path = `${userId}/${name}`;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      setInfo(`No se pudo eliminar: ${error.message}`);
      return;
    }
    await listFiles(userId);
  }

  const disabled = useMemo(() => busy || !file, [busy, file]);

  return (
    <main className="min-h-dvh bg-[var(--color-brand-background)] p-6 md:p-10 flex items-center justify-center">
      <UiCard>
        {/* Header */}
        <div className="px-7 md:px-10 py-8 bg-[linear-gradient(180deg,#fff,rgba(255,255,255,0.7))]">
          <h1 className="text-4xl md:text-5xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-4">
            <ColorEmoji emoji="🗂️" size={40} mode="duotone" />
            Subida a Storage (prueba)
          </h1>
          <p className="mt-2 text-[var(--color-brand-bluegray)] text-lg">
            <ColorEmoji emoji="👤" size={20} className="mr-1" />
            Usuario actual:{" "}
            {email ? (
              <span className="font-medium text-[var(--color-brand-text)]">{email}</span>
            ) : (
              <span className="italic">(no autenticado)</span>
            )}
          </p>
        </div>

        {/* Body */}
        <div className="px-7 md:px-10 py-8 space-y-6">
          {/* Uploader */}
          <div>
            <label className="block text-[var(--color-brand-text)] font-medium mb-2">
              <span className="inline-flex items-center gap-2">
                <ColorEmoji emoji="📎" mode="duotone" />
                Archivo
              </span>
            </label>

            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="
                block w-full rounded-2xl border border-[var(--color-brand-border)]
                bg-white px-4 py-3 text-[var(--color-brand-text)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]
              "
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={disabled}
                className="
                  inline-flex items-center gap-2 rounded-2xl px-5 py-3
                  bg-[var(--color-brand-primary)] text-white
                  hover:brightness-95 active:brightness-90 transition
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                <ColorEmoji emoji="⬆️" mode="native" />
                Subir
              </button>

              <button
                onClick={() => userId && listFiles(userId)}
                disabled={!userId}
                className="
                  inline-flex items-center gap-2 rounded-2xl px-5 py-3
                  bg-[color-mix(in_oklab,#fff_80%,var(--color-brand-primary)_10%)]
                  text-[var(--color-brand-text)]
                  hover:bg-[color-mix(in_oklab,#fff_85%,var(--color-brand-primary)_10%)]
                  border border-[var(--color-brand-border)] transition
                "
              >
                <ColorEmoji emoji="🔄" mode="duotone" />
                Actualizar lista
              </button>
            </div>
          </div>

          <hr className="border-[var(--color-brand-border)] my-2" />

          {/* Lista */}
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <ColorEmoji emoji="📁" mode="duotone" />
              Tus archivos
            </h2>

            {items.length === 0 ? (
              <p className="mt-2 text-[var(--color-brand-bluegray)]">(No hay archivos)</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {items.map((it) => (
                  <li
                    key={it.name}
                    className="
                      rounded-2xl border border-[var(--color-brand-border)]
                      bg-white px-4 py-3 flex items-center justify-between gap-4
                    "
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--color-brand-text)] truncate">
                        {it.name}
                      </p>
                      <p className="text-sm text-[var(--color-brand-bluegray)] truncate">
                        {userId}/{it.name}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => viewItem(it.name)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-[var(--color-brand-border)] hover:bg-[color-mix(in_oklab,#fff_85%,var(--color-brand-primary)_10%)]"
                      >
                        <ColorEmoji emoji="👀" mode="native" />
                        Ver
                      </button>
                      <button
                        onClick={() => downloadItem(it.name)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-[var(--color-brand-border)] hover:bg-[color-mix(in_oklab,#fff_85%,var(--color-brand-primary)_10%)]"
                      >
                        <ColorEmoji emoji="⬇️" mode="native" />
                        Descargar
                      </button>
                      <button
                        onClick={() => copyLink(it.name)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-[var(--color-brand-border)] hover:bg-[color-mix(in_oklab,#fff_85%,var(--color-brand-primary)_10%)]"
                      >
                        <ColorEmoji emoji="🔗" mode="duotone" />
                        Copiar enlace
                      </button>
                      <button
                        onClick={() => removeItem(it.name)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2
                          bg-[color-mix(in_oklab,var(--color-brand-primary)_35%,#000)]
                          text-white hover:brightness-95"
                      >
                        <ColorEmoji emoji="🗑️" mode="native" />
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mensajes */}
          {info && (
            <p className="mt-2 text-sm text-[var(--color-brand-text)] bg-[color-mix(in_oklab,#fff_90%,var(--color-brand-primary)_10%)] border border-[var(--color-brand-border)] rounded-xl px-4 py-3">
              {info}
            </p>
          )}
        </div>
      </UiCard>
    </main>
  );
}

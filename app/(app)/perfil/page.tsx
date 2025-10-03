"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";
import ColorEmoji from "@/components/ColorEmoji";
import { useToast } from "@/components/Toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function PerfilPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
      setEmail(u.email ?? "");
      setName((u.user_metadata as any)?.full_name ?? "");
      const path = (u.user_metadata as any)?.avatar_path ?? null;
      setAvatarPath(path);
      if (path) {
        const { data: signed } = await supabase.storage
          .from("uploads")
          .createSignedUrl(path, 60 * 60);
        setAvatarUrl(signed?.signedUrl ?? null);
      }
      setLoading(false);
    })();
  }, [router]);

  async function refreshSignedUrl(path: string | null) {
    if (!path) {
      setAvatarUrl(null);
      return;
    }
    const { data } = await supabase.storage.from("uploads").createSignedUrl(path, 60 * 60);
    setAvatarUrl(data?.signedUrl ?? null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name, avatar_path: avatarPath ?? null },
    });
    setSaving(false);
    if (error) {
      toast({ variant: "error", title: "No se pudo guardar", description: error.message });
      return;
    }
    toast({ variant: "success", title: "Perfil actualizado" });
  }

  function triggerPick() {
    fileRef.current?.click();
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !user) return;

    if (!f.type.startsWith("image/")) {
      toast({
        variant: "error",
        title: "Archivo no válido",
        description: "Sube una imagen (PNG/JPG/WebP…)",
      });
      e.target.value = "";
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast({ variant: "error", title: "Imagen muy pesada", description: "Máx. 5 MB" });
      e.target.value = "";
      return;
    }

    const ext = f.name.split(".").pop()?.toLowerCase() || "png";
    const path = `avatars/${user.id}_${Date.now()}.${ext}`.replace(/\s+/g, "_");

    const { error } = await supabase.storage.from("uploads").upload(path, f, {
      upsert: false,
    });
    if (error) {
      toast({ variant: "error", title: "No se pudo subir el avatar", description: error.message });
      e.target.value = "";
      return;
    }

    setAvatarPath(path);
    await refreshSignedUrl(path);

    // Guarda inmediatamente en metadata para que quede persistente
    await supabase.auth.updateUser({ data: { full_name: name, avatar_path: path } });

    toast({ variant: "success", title: "Avatar actualizado" });
    e.target.value = "";
  }

  async function removeAvatar() {
    if (!avatarPath) return setAvatarUrl(null);
    const ok = window.confirm("¿Quitar avatar?");
    if (!ok) return;

    // Intenta borrar el archivo (si falla, igual limpiamos metadata)
    await supabase.storage.from("uploads").remove([avatarPath]);

    setAvatarPath(null);
    setAvatarUrl(null);
    await supabase.auth.updateUser({ data: { full_name: name, avatar_path: null } });
    toast({ variant: "success", title: "Avatar quitado" });
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const AvatarVisual = useMemo(() => {
    return (
      <div className="size-28 rounded-full overflow-hidden border border-[var(--color-brand-border)] bg-[var(--color-brand-background)] flex items-center justify-center">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="text-4xl">
            <ColorEmoji token="usuario" size={40} />
          </div>
        )}
      </div>
    );
  }, [avatarUrl]);

  if (loading) {
    return (
      <main className="p-6 md:p-10">
        <div className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-8 animate-pulse">
          <div className="h-7 w-48 bg-[var(--color-brand-background)] rounded mb-4" />
          <div className="h-5 w-80 bg-[var(--color-brand-background)] rounded" />
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10 space-y-8">
      {/* Encabezado */}
      <header>
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="usuario" size={30} />
          Perfil
        </h1>
        <p className="text-[var(--color-brand-bluegray)]">
          Actualiza tu información básica y tu avatar.
        </p>
      </header>

      {/* Card principal */}
      <section
        className="
          w-full rounded-3xl bg-white/95 border border-[var(--color-brand-border)]
          shadow-[0_10px_30px_rgba(0,0,0,0.06)] px-6 md:px-8 py-7
        "
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6">
          {/* Columna avatar */}
          <div className="flex flex-col items-start gap-4">
            {AvatarVisual}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={triggerPick}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-[var(--color-brand-primary)] text-white hover:brightness-95"
              >
                <ColorEmoji token="imagen" />
                Subir avatar
              </button>
              <button
                type="button"
                onClick={removeAvatar}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-white border border-[var(--color-brand-border)] hover:brightness-95"
              >
                <ColorEmoji token="limpiar" />
                Quitar
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPick}
            />
          </div>

          {/* Columna formulario */}
          <div className="space-y-5">
            {/* Correo (solo lectura) */}
            <div>
              <label className="block text-sm text-[var(--color-brand-bluegray)] mb-1">
                Correo
              </label>
              <input
                value={email}
                readOnly
                className="
                  w-full rounded-2xl border border-[var(--color-brand-border)]
                  bg-[color-mix(in_oklab,#fff_92%,var(--color-brand-background)_8%)]
                  px-5 py-3 text-[var(--color-brand-text)]
                "
              />
            </div>

            {/* Nombre para mostrar */}
            <div>
              <label className="block text-sm text-[var(--color-brand-bluegray)] mb-1">
                Nombre para mostrar
              </label>
              <input
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="
                  w-full rounded-2xl border border-[var(--color-brand-border)]
                  bg-white px-5 py-3 text-[var(--color-brand-text)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]
                "
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 bg-[var(--color-brand-primary)] text-white hover:brightness-95 disabled:opacity-60"
              >
                <ColorEmoji token="guardar" />
                Guardar cambios
              </button>

              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 bg-white border border-[var(--color-brand-border)] hover:brightness-95"
              >
                <ColorEmoji token="salir" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, type User } from "@supabase/supabase-js";
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
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        const u = data.user;
        if (!u) {
          router.push("/login");
          return;
        }
        if (!mountedRef.current) return;
        setUser(u);
        setEmail(u.email ?? "");
        setName(((u.user_metadata as any)?.full_name as string) ?? "");
        const path = ((u.user_metadata as any)?.avatar_path as string | undefined) ?? null;
        setAvatarPath(path);
        await refreshSignedUrl(path);
      } catch (err: any) {
        toast({
          variant: "error",
          title: "No se pudo cargar tu perfil",
          description: err?.message ?? "Intenta nuevamente.",
        });
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, [router, toast]);

  async function refreshSignedUrl(path: string | null) {
    try {
      if (!path) {
        setAvatarUrl(null);
        return;
      }
      const { data, error } = await supabase.storage.from("uploads").createSignedUrl(path, 60 * 60);
      if (error) throw error;
      // Evita caches agresivos del <img> añadiendo un nonce corto
      const url = data?.signedUrl ? `${data.signedUrl}&_=${Date.now()}` : null;
      setAvatarUrl(url);
    } catch (err) {
      setAvatarUrl(null);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name || null, avatar_path: avatarPath ?? null },
      });
      if (error) throw error;
      toast({ variant: "success", title: "Perfil actualizado" });
    } catch (err: any) {
      toast({ variant: "error", title: "No se pudo guardar", description: err?.message });
    } finally {
      setSaving(false);
    }
  }

  function triggerPick() {
    fileRef.current?.click();
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    try {
      if (!f || !user) return;

      if (!f.type.startsWith("image/")) {
        throw new Error("Sube una imagen (PNG/JPG/WebP…).");
      }
      if (f.size > 5 * 1024 * 1024) {
        throw new Error("La imagen supera 5 MB.");
      }

      const ext = (f.name.split(".").pop() || "png").toLowerCase();
      const path = `avatars/${user.id}_${Date.now()}.${ext}`.replace(/\s+/g, "_");

      const { error: upErr } = await supabase.storage.from("uploads").upload(path, f, {
        upsert: false,
      });
      if (upErr) throw upErr;

      setAvatarPath(path);
      await refreshSignedUrl(path);

      // Persiste en metadata inmediatamente (UI responsiva)
      await supabase.auth.updateUser({ data: { full_name: name || null, avatar_path: path } });

      toast({ variant: "success", title: "Avatar actualizado" });
    } catch (err: any) {
      toast({
        variant: "error",
        title: "No se pudo subir el avatar",
        description: err?.message ?? "Intenta nuevamente.",
      });
    } finally {
      // Limpia el input para permitir re-subir el mismo archivo si hace falta
      e.target.value = "";
    }
  }

  async function removeAvatar() {
    if (!avatarPath) {
      setAvatarUrl(null);
      return;
    }
    const ok = window.confirm("¿Quitar avatar?");
    if (!ok) return;

    try {
      // Borrar archivo (si falla, igualmente limpiamos metadata)
      await supabase.storage.from("uploads").remove([avatarPath]);
    } catch {
      // Silencioso, no bloquea
    } finally {
      setAvatarPath(null);
      setAvatarUrl(null);
      await supabase.auth.updateUser({ data: { full_name: name || null, avatar_path: null } });
      toast({ variant: "success", title: "Avatar quitado" });
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      router.push("/login");
    }
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
        <p className="text-[var(--color-brand-bluegray)]">Actualiza tu información básica y tu avatar.</p>
      </header>

      {/* Card principal */}
      <section className="w-full rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] px-6 md:px-8 py-7">
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6" aria-busy={saving}>
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
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
          </div>

          {/* Columna formulario */}
          <div className="space-y-5">
            {/* Correo (solo lectura) */}
            <div>
              <label className="block text-sm text-[var(--color-brand-bluegray)] mb-1">Correo</label>
              <input
                value={email}
                readOnly
                aria-readonly="true"
                className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-[color-mix(in_oklab,#fff_92%,var(--color-brand-background)_8%)] px-5 py-3 text-[var(--color-brand-text)]"
              />
            </div>

            {/* Nombre para mostrar */}
            <div>
              <label className="block text-sm text-[var(--color-brand-bluegray)] mb-1">Nombre para mostrar</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-5 py-3 text-[var(--color-brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 bg-[var(--color-brand-primary)] text-white hover:brightness-95 disabled:opacity-60"
              >
                <ColorEmoji token="guardar" />
                {saving ? "Guardando…" : "Guardar cambios"}
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

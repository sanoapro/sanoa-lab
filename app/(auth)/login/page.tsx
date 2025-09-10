"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import ColorEmoji from "@/components/ColorEmoji";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirect_to") || "/dashboard";
  const supabase = getSupabaseBrowser();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Si ya hay sesión, redirige al Tablero
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace(redirectTo);
    })();
  }, [router, supabase, redirectTo]);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.replace(redirectTo);
  }

  async function onGoogle() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: origin + (redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ""),
      },
    });
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center p-4">
      <section
        className="w-full max-w-lg rounded-3xl border border-[var(--color-brand-border)]
                   bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur p-6 md:p-8 space-y-6"
      >
        {/* Encabezado */}
        <header className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="candado" size={20} />
            </span>
            Iniciar sesión
          </h1>
          <p className="text-[var(--color-brand-bluegray)] flex items-center gap-2">
            <ColorEmoji token="magia" size={16} />
            Bienvenido/a a Sanoa
          </p>
        </header>

        {/* Errores */}
        {err && (
          <p className="text-sm text-red-600" role="alert">
            {err}
          </p>
        )}

        {/* Formulario */}
        <form onSubmit={onLogin} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm text-[var(--color-brand-text)]/80 flex items-center gap-2">
              <ColorEmoji token="email" size={16} /> Correo
            </span>
            <input
              type="email"
              name="email"
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-coral)]"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-[var(--color-brand-text)]/80 flex items-center gap-2">
              <ColorEmoji token="llave" size={16} /> Contraseña
            </span>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-coral)]"
            />
          </label>

          <div className="flex items-center justify-between">
            <a href="/reset-password" className="text-sm text-[var(--color-brand-coral)] underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3 text-white font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <ColorEmoji token="siguiente" size={18} />
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        {/* Separador */}
        <div className="relative">
          <div className="h-px bg-[var(--color-brand-border)]" />
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 text-xs text-[var(--color-brand-bluegray)]">
            o
          </span>
        </div>

        {/* OAuth */}
        <button
          onClick={onGoogle}
          className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3 text-[var(--color-brand-text)] hover:bg-[var(--color-brand-background)] flex items-center justify-center gap-2"
        >
          <ColorEmoji token="web" size={18} />
          Continuar con Google
        </button>
      </section>
    </main>
  );
}

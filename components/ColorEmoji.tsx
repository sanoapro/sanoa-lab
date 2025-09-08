"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";
import { emojiTokens as E } from "@/config/emojiTheme";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = getSupabaseBrowser();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // lee redirect_to que puso el middleware (fallback a /dashboard)
  const redirectTo = decodeURIComponent(search.get("redirect_to") ?? "/dashboard");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    setLoading(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    // auth-helpers setea cookie; con replace evitas volver atrás al login
    router.replace(redirectTo);
  }

  async function signInGoogle() {
    setMsg(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`,
      },
    });
    setLoading(false);
    if (error) setMsg(error.message);
  }

  return (
    <main className="min-h-dvh bg-[var(--color-brand-background)] p-6 md:p-10 flex items-center justify-center">
      <section className="w-full max-w-xl rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] bg-white/95 border border-[var(--color-brand-border)] backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="px-7 md:px-10 py-8 bg-[linear-gradient(180deg,#fff,rgba(255,255,255,0.7))]">
          <h1 className="text-4xl md:text-5xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-4">
            <ColorEmoji token="login" size={40} />
            Iniciar sesión
          </h1>
          <p className="mt-2 text-[var(--color-brand-bluegray)] text-lg">
            <ColorEmoji emoji="✨" className="mr-1" />
            Bienvenido/a a Sanoa
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-7 md:px-10 py-8 space-y-6">
          {/* Email */}
          <label className="block text-[var(--color-brand-text)] font-medium mb-1">
            <span className="inline-flex items-center gap-2">
              <ColorEmoji token="email" />
              Correo
            </span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@dominio.com"
            className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-5 py-4 text-[var(--color-brand-text)] placeholder:text-[color-mix(in_oklab,var(--color-brand-bluegray)_75%,white)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
          />

          {/* Password */}
          <label className="block text-[var(--color-brand-text)] font-medium mb-1 mt-4">
            <span className="inline-flex items-center gap-2">
              <ColorEmoji token="password" />
              Contraseña
            </span>
          </label>
          <input
            type="password"
            required
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-5 py-4 text-[var(--color-brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
          />

          {/* Botón Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 inline-flex items-center justify-center gap-3 rounded-2xl px-5 py-4 bg-[var(--color-brand-primary)] text-white hover:brightness-95 active:brightness-90 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-2">
              <ColorEmoji token="siguiente" />
              Entrar
            </span>
          </button>

          {/* Separador */}
          <div className="my-4 h-px w-full bg-[var(--color-brand-border)]" />

          {/* Google */}
          <button
            type="button"
            onClick={signInGoogle}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-3 rounded-2xl px-5 py-4 bg-[color-mix(in_oklab,#fff_70%,var(--color-brand-primary)_0%)] text-[var(--color-brand-text)] hover:bg-[color-mix(in_oklab,#fff_80%,var(--color-brand-primary)_0%)] border border-[var(--color-brand-border)] transition"
          >
            <ColorEmoji token="globo" /> {/* nativo según tu config */}
            Continuar con Google
          </button>

          {msg && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {msg}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

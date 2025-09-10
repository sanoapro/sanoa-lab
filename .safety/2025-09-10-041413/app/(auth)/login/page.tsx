"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirect_to") || "/dashboard";
  const supabase = getSupabaseBrowser();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    <div className="mx-auto max-w-sm space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <form onSubmit={onLogin} className="space-y-3">
        <input
          type="email"
          name="email"
          placeholder="Correo"
          className="w-full rounded-md border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-coral)]"
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          className="w-full rounded-md border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-coral)]"
        />
        <button
          disabled={loading}
          className="w-full rounded-md bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <button
        onClick={onGoogle}
        className="w-full rounded-md bg-[var(--color-brand-bluegray)] px-4 py-2 text-white hover:opacity-90"
      >
        Entrar con Google
      </button>

      <a
        href="/reset-password"
        className="block text-center text-sm text-[var(--color-brand-coral)] underline"
      >
        ¿Olvidaste tu contraseña?
      </a>
    </div>
  );
}

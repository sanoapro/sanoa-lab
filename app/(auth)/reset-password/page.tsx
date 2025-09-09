"use client";
import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";

export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const E = email.trim();
    if (!E) { setError("Escribe tu correo."); return; }
    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "";
      const redirectTo = `${origin}/(auth)/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(E, { redirectTo });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      setError(err?.message || "No se pudo enviar el correo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[80vh] grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-brand-border)] bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
          <ColorEmoji token="llave" size={22} /> Recuperar contraseña
        </h1>
        <p className="text-[var(--color-brand-bluegray)] mt-1 text-sm">
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {done ? (
          <div className="mt-4 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)] p-3 text-sm">
            Revisa tu correo y sigue el enlace para continuar.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm text-[var(--color-brand-text)]/80">Correo</span>
              <input
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder="tucorreo@dominio.com"
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
                autoFocus
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              className="w-full rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              disabled={loading}
            >
              <ColorEmoji token="enviar" size={16} />
              {loading ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link href="/login" className="text-[var(--color-brand-primary)] hover:underline">
            <ColorEmoji token="atras" size={14} /> Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}

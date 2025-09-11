"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";

/** Traducción breve de errores comunes */
function toSpanishError(e: unknown): string {
  const msg =
    typeof e === "object" && e && "message" in e ? String((e as any).message) : String(e ?? "");
  if (/invalid email/i.test(msg)) return "El correo no es válido.";
  if (/rate limit/i.test(msg)) return "Has hecho demasiadas solicitudes. Intenta más tarde.";
  return msg || "No se pudo enviar el enlace.";
}

export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowser();

  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Origen seguro para construir redirectTo (prefiere NEXT_PUBLIC_SITE_URL si es URL válida)
  const site = useMemo(() => {
    const env = process.env.NEXT_PUBLIC_SITE_URL;
    if (env && /^https?:\/\//.test(env)) return env;
    if (typeof window !== "undefined") return window.location.origin;
    return "http://localhost:3000";
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const em = email.trim();
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(em)) {
      showToast("Ingresa un correo válido.", "error");
      return;
    }

    setErr(null);
    setSaving(true);
    try {
      const redirectTo = new URL("/update-password", site).toString(); // (auth) es segmento de grupo, no aparece en URL
      const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo });
      if (error) throw error;
      showToast("Te enviamos un enlace para restablecer tu contraseña.", "success");
    } catch (e) {
      const msg = toSpanishError(e);
      setErr(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-[var(--color-brand-border)] bg-white shadow p-6">
        <header className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl p-3 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
            <ColorEmoji token="email" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-brand-text)]">Restablecer contraseña</h1>
            <p className="text-sm text-[var(--color-brand-bluegray)]">Te enviaremos un enlace seguro a tu correo.</p>
          </div>
        </header>

        {err && (
          <div
            className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
            aria-live="polite"
          >
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--color-brand-text)]">
              <span className="inline-flex items-center gap-2">
                <ColorEmoji token="email" size={16} /> Correo electrónico
              </span>
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bluegray)]"
              placeholder="tucorreo@dominio.com"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            data-loading={saving ? "1" : undefined}
            className="w-full rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white font-semibold transition-opacity disabled:opacity-60 data-[loading=1]:pointer-events-none"
          >
            {saving ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm underline inline-flex items-center gap-2">
            <ColorEmoji token="atras" size={16} /> Volver a iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
}

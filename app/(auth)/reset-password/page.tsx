"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";
import { Field, Input } from "@/components/ui/field";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setBusy(true);
    try {
      const site =
        process.env.NEXT_PUBLIC_SITE_URL && /^https?:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL)
          ? process.env.NEXT_PUBLIC_SITE_URL
          : typeof window !== "undefined"
            ? window.location.origin
            : "";
      const redirectTo = new URL("/callback", site);
      redirectTo.searchParams.set("next", "/reset-password/change");

      const { error } = await getSupabaseBrowser().auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo.toString(),
      });
      if (error) throw error;
      setMsg("Te enviamos un enlace para restablecer tu contraseña.");
    } catch (e: any) {
      setErr(e?.message || "No se pudo enviar el correo de recuperación.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-10">
      <section className="surface-light w-full max-w-md rounded-2xl border border-[var(--color-brand-border)] bg-white/95 backdrop-blur shadow-lg p-6">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <ColorEmoji emoji="🛟" /> Recuperar acceso
        </h1>
        <p className="text-sm text-[var(--color-brand-bluegray)] mt-1">
          Te enviaremos un enlace para cambiar tu contraseña.
        </p>

        {msg && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {msg}
          </div>
        )}
        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
          <Field label="Correo" htmlFor="email" required error={err ?? undefined} errorId={err ? "reset-email-error" : undefined}>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              invalid={Boolean(err)}
              aria-describedby={err ? "reset-email-error" : undefined}
            />
          </Field>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[var(--color-brand-primary)] px-4 py-3 text-white font-semibold disabled:opacity-60"
          >
            {busy ? "Enviando…" : "Enviar enlace"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full mt-1 rounded-xl border border-[var(--color-brand-border)] bg-white px-4 py-3 font-medium"
          >
            Volver al login
          </button>
        </form>
      </section>
    </main>
  );
}

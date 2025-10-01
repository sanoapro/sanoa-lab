"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";
import { Field, Input } from "@/components/ui/field";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await getSupabaseBrowser().auth.getSession();
      if (!alive) return;
      setReady(!!data.session);
      if (!data.session) setErr("El enlace de recuperación no es válido o expiró.");
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { error } = await getSupabaseBrowser().auth.updateUser({ password: pass });
      if (error) throw error;
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "No se pudo actualizar la contraseña.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 py-10">
      <section className="surface-light w-full max-w-md rounded-2xl border border-[var(--color-brand-border)] bg-white/95 backdrop-blur shadow-lg p-6">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <ColorEmoji emoji="🔒" /> Cambiar contraseña
        </h1>
        <p className="text-sm text-[var(--color-brand-bluegray)] mt-1">
          Ingresa tu nueva contraseña para continuar.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <Field
            label="Nueva contraseña"
            htmlFor="password"
            required
            hint="Mínimo 8 caracteres"
            error={err ?? undefined}
            errorId={err ? "change-password-error" : undefined}
          >
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              invalid={Boolean(err)}
              aria-describedby={err ? "change-password-error" : undefined}
            />
          </Field>

          <button
            type="submit"
            disabled={!ready || busy || pass.length < 8}
            className="w-full rounded-xl bg-[var(--color-brand-bluegray)] px-4 py-3 text-white font-semibold disabled:opacity-60"
          >
            {busy ? "Guardando…" : "Guardar y entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

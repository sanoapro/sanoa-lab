"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";
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

        {err && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block" htmlFor="password">
            <span className="mb-1 block text-sm font-medium text-[var(--color-brand-text)]">
              Nueva contraseña
            </span>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bluegray)]"
              placeholder="••••••••"
            />
          </label>

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

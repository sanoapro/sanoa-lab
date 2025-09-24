// app/(auth)/update-password/page.tsx
"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";
import { toSpanishError } from "@/lib/i18n-errors";

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] grid place-items-center p-6 text-[var(--color-brand-bluegray)]">
          Cargando…
        </main>
      }
    >
      <UpdatePasswordClient />
    </Suspense>
  );
}

function UpdatePasswordClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState<"checking" | "ready" | "error">("checking");

  // Redirección segura al finalizar
  const safeRedirect = useMemo(() => {
    const r = params.get("redirect_to") || "/dashboard";
    return r.startsWith("/") && !r.startsWith("//") ? r : "/dashboard";
  }, [params]);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseBrowser();
        // Si el hash venía en la URL, supabase-js (detectSessionInUrl=true) ya lo habrá almacenado.
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          setErr(
            "No se detectó una sesión de recuperación. Usa el enlace del correo o solicita uno nuevo."
          );
          setReady("error");
          return;
        }
        setReady("ready");
      } catch (e) {
        setErr(toSpanishError(e));
        setReady("error");
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setErr(null);

    if (p1.length < 8) {
      setErr("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (p1 !== p2) {
      setErr("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password: p1 });
      if (error) throw error;
      showToast({
        title: "Contraseña actualizada",
        description: "¡Bienvenido/a!",
        variant: "success",
      });
      router.replace(safeRedirect);
    } catch (e) {
      setErr(toSpanishError(e));
      setSaving(false);
    }
  }

  if (ready === "checking") {
    return (
      <main className="min-h-[100dvh] grid place-items-center p-6 text-[var(--color-brand-bluegray)]">
        Verificando…
      </main>
    );
  }

  if (ready === "error") {
    return (
      <main className="min-h-[100dvh] grid place-items-center p-6">
        <section className="w-full max-w-md rounded-2xl border border-[var(--color-brand-border)] bg-white p-6 shadow">
          <div className="mb-3 text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">
            {err}
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[var(--color-brand-text)] underline"
          >
            <ColorEmoji token="atras" size={16} /> Volver a login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-[var(--color-brand-border)] bg-white p-6 shadow">
        <header className="mb-4 flex items-center gap-3">
          <ColorEmoji token="llave" size={20} />
          <h1 className="text-lg font-semibold text-[var(--color-brand-text)]">
            Definir nueva contraseña
          </h1>
        </header>

        {err && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--color-brand-text)]">
              <span className="inline-flex items-center gap-2">
                <ColorEmoji token="llave" size={16} /> Nueva contraseña
              </span>
            </span>
            <input
              type="password"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-brand-border)] px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bluegray)]"
              placeholder="••••••••"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--color-brand-text)]">
              <span className="inline-flex items-center gap-2">
                <ColorEmoji token="llave" size={16} /> Confirmar contraseña
              </span>
            </span>
            <input
              type="password"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-brand-border)] px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bluegray)]"
              placeholder="••••••••"
              required
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            data-loading={saving ? "1" : undefined}
            className="w-full rounded-xl bg-[var(--color-brand-bluegray)] px-4 py-3 text-white font-semibold transition-opacity disabled:opacity-60 data-[loading=1]:pointer-events-none"
          >
            {saving ? "Guardando…" : "Guardar y entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

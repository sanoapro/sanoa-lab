"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { toSpanishError } from "@/lib/i18n-errors";
import ColorEmoji from "@/components/ColorEmoji";

function Inner() {
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "error">("checking");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (data.session) setReady("ok");
      else {
        setMsg("No se detectó una sesión de recuperación. Abre el enlace que llega a tu correo y vuelve a intentar.");
        setReady("error");
      }
    })();
  }, []);

  const canSubmit = p1.length >= 8 && p1 === p2 && !saving;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setMsg(null);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password: p1 });
      if (error) throw error;
      setMsg("Contraseña actualizada. ¡Bienvenido!");
      router.replace("/dashboard");
    } catch (e) {
      setMsg(toSpanishError(e));
    } finally {
      setSaving(false);
    }
  }

  if (ready === "checking") return <div className="p-6 text-center text-[var(--color-brand-bluegray)]">Verificando…</div>;

  if (ready === "error")
    return (
      <section className="mx-auto max-w-sm p-6 text-center">
        <p className="mb-3 text-red-600">{msg}</p>
        <Link href="/login" className="inline-flex items-center gap-2 underline">
          <ColorEmoji token="atras" size={16} /> Volver a login
        </Link>
      </section>
    );

  return (
    <section className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold mb-2 flex items-center gap-2">
        <ColorEmoji token="logo" size={20} /> Nueva contraseña
      </h1>

      {msg && <p className="mb-3 text-sm text-[var(--color-brand-bluegray)]">{msg}</p>}

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-medium">
          <span>Escribe tu nueva contraseña</span>
          <input
            type="password"
            required
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bluegray)]"
          />
        </label>

        <label className="block text-sm font-medium">
          <span>Confirmar contraseña</span>
          <input
            type="password"
            required
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bluegray)]"
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          aria-busy={saving}
          className="w-full rounded-xl bg-[var(--color-brand-bluegray)] px-4 py-3 text-white font-semibold disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Actualizar contraseña"}
        </button>
      </form>
    </section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-[var(--color-brand-bluegray)]">Cargando…</div>}>
      <Inner />
    </Suspense>
  );
}

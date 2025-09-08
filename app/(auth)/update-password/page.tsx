"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";

export default function UpdatePasswordPage() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();
  const search = useSearchParams();
  const [okSession, setOkSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setOkSession(true);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setOkSession(!!data.session);
      } catch (e: any) {
        setError(e?.message || "No se pudo validar el enlace.");
      } finally {
        setLoading(false);
      }
    })();
  }, [search, supabase]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const f = new FormData(e.currentTarget);
    const p = String(f.get("password") || "");
    const c = String(f.get("confirm") || "");
    if (p.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); setSaving(false); return; }
    if (p !== c) { setError("Las contraseñas no coinciden."); setSaving(false); return; }
    const { error } = await supabase.auth.updateUser({ password: p });
    setSaving(false);
    if (error) { setError(error.message); return; }
    showToast("Tu contraseña fue actualizada.", "success");
    router.replace("/login");
  }

  if (loading) return <p className="text-center p-4">Validando enlace…</p>;
  if (!okSession) return <p className="text-center p-4 text-red-600">Enlace inválido o expirado.</p>;

  return (
    <div className="mx-auto max-w-sm space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
        <ColorEmoji emoji="🔑" size={20} />
        Nueva contraseña
      </h1>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <form onSubmit={onSubmit} className="space-y-3" aria-busy={saving}>
        <input type="password" name="password" placeholder="Nueva contraseña" required
          className="w-full rounded-md border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-coral)]" />
        <input type="password" name="confirm" placeholder="Repetir contraseña" required
          className="w-full rounded-md border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-coral)]" />
        <button disabled={saving}
          className="w-full rounded-md bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60">
          {saving ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>
    </div>
  );
}

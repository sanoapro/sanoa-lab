"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";

function parseHashTokens(hash: string) {
  if (!hash?.startsWith("#")) return {};
  const p = new URLSearchParams(hash.slice(1));
  const access_token = p.get("access_token") || undefined;
  const refresh_token = p.get("refresh_token") || undefined;
  return { access_token, refresh_token };
}

export default function UpdatePasswordPage() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();
  const sp = useSearchParams();

  const [ensuring, setEnsuring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Asegura sesión de recuperación
  useEffect(() => {
    (async () => {
      setEnsuring(true);
      setError(null);
      try {
        // 1) si viene ?code=... (PKCE)
        const code = sp.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setEnsuring(false);
          return;
        }
        // 2) si vienen tokens en el hash #access_token=...
        if (typeof window !== "undefined" && window.location.hash) {
          const { access_token, refresh_token } = parseHashTokens(window.location.hash);
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            // limpia el hash para evitar reintentos
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
            setEnsuring(false);
            return;
          }
        }
        // 3) si ya hay sesión válida
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setEnsuring(false);
          return;
        }
        throw new Error("No se pudo validar el enlace. Vuelve a solicitarlo.");
      } catch (err: any) {
        setError(err?.message || "No se pudo validar el enlace.");
        setEnsuring(false);
      }
    })();
  }, [sp, supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const p1 = pwd1.trim();
    const p2 = pwd2.trim();
    if (p1.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (p1 !== p2) { setError("Las contraseñas no coinciden."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: p1 });
      if (error) throw error;
      setDone(true);
      // Redirige suave al tablero (o login)
      setTimeout(() => router.replace("/dashboard"), 1200);
    } catch (err: any) {
      setError(err?.message || "No se pudo actualizar la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-[80vh] grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-brand-border)] bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
          <ColorEmoji token="llave" size={22} /> Nueva contraseña
        </h1>
        <p className="text-[var(--color-brand-bluegray)] mt-1 text-sm">
          {ensuring ? "Validando enlace…" : "Define tu nueva contraseña para continuar."}
        </p>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        {!ensuring && !done && !error && (
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm text-[var(--color-brand-text)]/80">Contraseña nueva</span>
              <input
                type="password"
                value={pwd1}
                onChange={(e)=>setPwd1(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
                placeholder="********"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="text-sm text-[var(--color-brand-text)]/80">Confirmar contraseña</span>
              <input
                type="password"
                value={pwd2}
                onChange={(e)=>setPwd2(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
                placeholder="********"
              />
            </label>
            <button
              className="w-full rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              disabled={saving}
            >
              <ColorEmoji token="guardar" size={16} />
              {saving ? "Guardando…" : "Guardar y entrar"}
            </button>
          </form>
        )}

        {done && (
          <div className="mt-4 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)] p-3 text-sm">
            ¡Listo! Tu contraseña fue actualizada. Redirigiendo…
          </div>
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

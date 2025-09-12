"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/** Icono oficial de Google “G” (inline, sin archivos extra) */
function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.22 0 6.13 1.11 8.42 3.29l6.3-6.3C34.82 3.16 29.86 1.5 24 1.5 14.62 1.5 6.53 7.06 3.03 15.02l7.8 6.06C12.4 15.57 17.76 9.5 24 9.5z"/>
      <path fill="#34A853" d="M46.5 24c0-1.61-.15-3.16-.43-4.65H24v9.3h12.7c-.55 2.97-2.17 5.48-4.63 7.17l7.1 5.53C43.9 37.4 46.5 31.2 46.5 24z"/>
      <path fill="#FBBC05" d="M10.83 21.08l-7.8-6.06C1.66 17.5 1.5 20.7 1.5 24c0 3.28.16 6.48 1.53 8.98l7.8-6.05C10.2 25.41 10.05 24.72 10.05 24s.15-1.41.78-2.92z"/>
      <path fill="#4285F4" d="M24 46.5c5.86 0 10.82-1.93 14.17-5.15l-7.1-5.53c-1.98 1.36-4.53 2.18-7.07 2.18-6.24 0-11.6-6.07-13.17-13.56l-7.8 6.05C6.53 40.94 14.62 46.5 24 46.5z"/>
    </svg>
  );
}

/** Traducción rápida de errores comunes de Supabase */
function toSpanishError(e: unknown): string {
  const msg = typeof e === "object" && e && "message" in e ? String((e as any).message) : String(e);
  if (/Invalid login credentials/i.test(msg)) return "Credenciales inválidas.";
  if (/provider is not enabled/i.test(msg)) return "El proveedor (Google) no está habilitado en Supabase. Actívalo en Authentication → Providers → Google.";
  if (/Email not confirmed/i.test(msg)) return "Tu correo aún no está verificado. Revisa tu bandeja de entrada.";
  if (/Unable to exchange external code/i.test(msg) || /PKCE/i.test(msg))
    return "No se pudo canjear el código de inicio de sesión (PKCE). Probable causa: el callback volvió a un origen distinto al que inició el login. Asegúrate de que login y callback usen exactamente el mismo dominio/puerto.";
  if (/Invalid Refresh Token/i.test(msg)) return "La sesión previa caducó. Intenta iniciar sesión de nuevo.";
  return msg;
}

/** Utilidades para limpiar sesión local sin romper la UI */
function getProjectRef(): string {
  try {
    const u = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    return new URL(u).hostname.split(".")[0];
  } catch {
    // Tu ref real (fallback seguro en dev)
    return "mmeybpohqtpvaxuhipjr";
  }
}
const AUTH_KEY = `sb-${getProjectRef()}-auth-token`;

async function clearLocalAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {}
  try {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut({ scope: "local" }); // no llama al server
  } catch {}
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirección segura post-login
  const safeRedirect = useMemo(() => {
    const r = params.get("redirect_to") || "/dashboard";
    return r.startsWith("/") && !r.startsWith("//") ? r : "/dashboard";
  }, [params]);

  // Checar sesión al montar + escuchar cambios de auth
  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowser();

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error && /Invalid Refresh Token|Refresh Token Not Found/i.test(error.message)) {
          // Sesión corrupta: limpiamos silenciosamente
          await clearLocalAuth();
        }
        if (!cancelled && data?.session) router.replace(safeRedirect);
      } catch (e) {
        // No rompemos la UI; si es refresh inválido, limpiamos y seguimos en login
        const msg = String((e as any)?.message ?? e ?? "");
        if (/Invalid Refresh Token|Refresh Token Not Found/i.test(msg)) {
          await clearLocalAuth();
        }
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (s?.access_token) router.replace(safeRedirect);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router, safeRedirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      router.replace(safeRedirect);
    } catch (e) {
      setErr(toSpanishError(e));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setErr(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();

      // Dominio público: .env si es válido; si no, origin del navegador
      const site =
        process.env.NEXT_PUBLIC_SITE_URL && /^https?:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL)
          ? process.env.NEXT_PUBLIC_SITE_URL
          : typeof window !== "undefined"
          ? window.location.origin
          : "";

      const url = new URL("/callback", site);
      url.searchParams.set("next", safeRedirect);
      const redirectTo = url.toString();

      // Diagnóstico leve en consola
      console.log("[LOGIN] origin=", typeof window !== "undefined" ? window.location.origin : "");
      console.log("[LOGIN] SITE_URL=", process.env.NEXT_PUBLIC_SITE_URL);
      console.log("[LOGIN] redirectTo=", redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (e) {
      setErr(toSpanishError(e));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-10">
      {/* Card */}
      <section className="w-full max-w-md rounded-2xl border border-[var(--color-brand-border)] bg-white shadow-lg">
        {/* Header del card */}
        <div className="flex items-center gap-3 border-b border-[var(--color-brand-border)] px-6 py-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(16,185,129,0.12)]">
            <ColorEmoji token="logo" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-brand-text)] leading-tight">
              Bienvenido/a a Sanoa
            </h1>
            <p className="text-sm text-[var(--color-brand-bluegray)]">
              Tu entorno está listo. Inicia sesión para continuar.
            </p>
          </div>
        </div>

        {/* Contenido del card */}
        <div className="px-6 py-5">
          {err && (
            <div
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
              aria-live="polite"
            >
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--color-brand-text)]">
                <span className="inline-flex items-center gap-2">
                  <ColorEmoji token="info" size={16} /> Correo electrónico
                </span>
              </span>
              <input
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bluegray)]"
                placeholder="tucorreo@ejemplo.com"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--color-brand-text)]">
                <span className="inline-flex items-center gap-2">
                  <ColorEmoji token="llave" emoji="🔑" size={16} /> Contraseña
                </span>
              </span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bluegray)]"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full rounded-xl bg-[var(--color-brand-bluegray)] px-4 py-3 text-white font-semibold transition-opacity disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3 text-xs text-[var(--color-brand-bluegray)]">
            <div className="h-px flex-1 bg-[var(--color-brand-border)]" />
            <span>o</span>
            <div className="h-px flex-1 bg-[var(--color-brand-border)]" />
          </div>

          {/* Botón Google con logo */}
          <button
            type="button"
            onClick={onGoogle}
            disabled={loading}
            className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-4 py-3 font-medium transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-3"
            aria-label="Continuar con Google"
          >
            <GoogleGIcon className="h-5 w-5" />
            <span>Continuar con Google</span>
          </button>

          <div className="mt-4 text-center">
            <a href="/reset-password" className="text-sm underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-[var(--color-brand-bluegray)]">Cargando…</div>}>
      <Inner />
    </Suspense>
  );
}

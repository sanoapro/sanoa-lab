"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";

type Stage = "checking" | "ready" | "error";

function parseHashTokens(hash: string) {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const p = new URLSearchParams(h);
  return {
    access_token: p.get("access_token"),
    refresh_token: p.get("refresh_token"),
    type: p.get("type"),
  };
}

export default function UpdatePasswordPage() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();
  const search = useSearchParams();

  const [stage, setStage] = useState<Stage>("checking");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    return pwd.length >= 8 && pwd2.length >= 8 && pwd === pwd2 && !saving;
  }, [pwd, pwd2, saving]);

  useEffect(() => {
    (async () => {
      try {
        // 1) Si llega con ?code=..., intercambia por sesión
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (typeof window !== "undefined") {
          // 2) Si llega con #access_token=... maneja hash tokens
          const { access_token, refresh_token } = parseHashTokens(window.location.hash || "");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
          }
        }

        // 3) Verifica sesión activa
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          setStage("error");
          setErrMsg("No se detectó una sesión de recuperación. Usa el enlace del correo o solicita uno nuevo.");
          return;
        }
        setStage("ready");
      } catch (e: any) {
        setStage("error");
        setErrMsg(e?.message || "Ocurrió un problema al validar el enlace.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      showToast("Contraseña actualizada. ¡Bienvenido!", "success");
      router.replace("/dashboard");
    } catch (e: any) {
      showToast(e?.message || "No se pudo actualizar la contraseña.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (stage === "checking") {
    return (
      <main className="min-h-[80vh] grid place-items-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-6 flex items-center gap-3">
            <div className="rounded-2xl p-3 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="refrescar" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-brand-text)]">Verificando enlace…</h1>
              <p className="text-sm text-[var(--color-brand-bluegray)]">Un momento por favor.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (stage === "error") {
    return (
      <main className="min-h-[80vh] grid place-items-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl p-3 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
                <ColorEmoji token="info" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--color-brand-text)]">Enlace inválido o expirado</h1>
                <p className="text-sm text-[var(--color-brand-bluegray)]">{errMsg}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <Link href="/(auth)/reset-password" className="inline-flex items-center gap-2 text-[var(--color-brand-text)] hover:underline">
                <ColorEmoji token="email" size={16} /> Solicitar nuevo enlace
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 text-[var(--color-brand-text)] hover:underline">
                <ColorEmoji token="atras" size={16} /> Volver a login
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // stage === "ready"
  return (
    <main className="min-h-[80vh] grid place-items-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl p-3 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="candado" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-brand-text)]">Nueva contraseña</h1>
              <p className="text-sm text-[var(--color-brand-bluegray)]">Escribe y confirma tu nueva contraseña.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm text-[var(--color-brand-text)]/80">Contraseña nueva</span>
              <input
                type="password"
                value={pwd}
                onChange={(e)=>setPwd(e.target.value)}
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm text-[var(--color-brand-text)]/80">Confirmar contraseña</span>
              <input
                type="password"
                value={pwd2}
                onChange={(e)=>setPwd2(e.target.value)}
                minLength={8}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
            </label>

            <button
              disabled={!canSubmit}
              className="w-full rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <ColorEmoji token="guardar" size={16} />
              {saving ? "Guardando…" : "Guardar y entrar"}
            </button>
          </form>

          <div className="h-px bg-[var(--color-brand-border)]" />

          <div className="text-sm flex justify-between">
            <Link href="/(auth)/reset-password" className="inline-flex items-center gap-2 text-[var(--color-brand-text)] hover:underline">
              <ColorEmoji token="email" size={16} /> Volver a solicitar enlace
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 text-[var(--color-brand-text)] hover:underline">
              <ColorEmoji token="atras" size={16} /> Volver a login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

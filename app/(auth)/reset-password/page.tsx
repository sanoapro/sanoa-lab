"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ColorEmoji from "@/components/ColorEmoji";
import { useToast } from "@/components/Toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);

  // Detecta si venimos desde el correo (hay sesión temporal de recuperación)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setHasRecovery(!!data.session);
    })();
    // También escucha cambios del estado de auth (cuando llega desde el correo)
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setHasRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const redirectBack = useMemo(() => params.get("redirect_to") || "/dashboard", [params]);

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ variant: "error", title: "No pudimos enviar el correo", description: error.message, emoji: "❌" });
      return;
    }
    toast({
      variant: "success",
      title: "Correo enviado",
      description: "Revisa tu bandeja de entrada y sigue el enlace para cambiar tu contraseña.",
      emoji: "📧",
    });
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwd1.length < 6) {
      toast({ variant: "warning", title: "Contraseña muy corta", description: "Mínimo 6 caracteres.", emoji: "⚠️" });
      return;
    }
    if (pwd1 !== pwd2) {
      toast({ variant: "warning", title: "Las contraseñas no coinciden", emoji: "⚠️" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd1 });
    setLoading(false);
    if (error) {
      toast({ variant: "error", title: "No se pudo actualizar", description: error.message, emoji: "❌" });
      return;
    }
    toast({ variant: "success", title: "Contraseña actualizada", emoji: "✅" });
    router.replace(redirectBack);
  }

  return (
    <main className="min-h-dvh bg-[var(--color-brand-background)] p-6 md:p-10 flex items-center justify-center">
      <section
        className="
          w-full max-w-xl rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]
          bg-white/95 border border-[var(--color-brand-border)]
          backdrop-blur-sm overflow-hidden
        "
      >
        {/* Header */}
        <div className="px-7 md:px-10 py-8 bg-[linear-gradient(180deg,#fff,rgba(255,255,255,0.7))]">
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
            <ColorEmoji emoji={hasRecovery ? "🔑" : "🔐"} />
            {hasRecovery ? "Define tu nueva contraseña" : "Recuperar contraseña"}
          </h1>
          <p className="mt-2 text-[var(--color-brand-bluegray)]">
            <ColorEmoji emoji="✨" className="mr-1" />
            {hasRecovery
              ? "Escribe y confirma una nueva contraseña para tu cuenta."
              : "Te enviaremos un enlace seguro a tu correo."}
          </p>
        </div>

        {/* Contenido */}
        {!hasRecovery ? (
          <form onSubmit={handleSendEmail} className="px-7 md:px-10 py-8 space-y-6">
            <label className="block text-[var(--color-brand-text)] font-medium mb-1">
              <span className="inline-flex items-center gap-2">
                <ColorEmoji emoji="📧" />
                Correo
              </span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@dominio.com"
              className="
                w-full rounded-2xl border border-[var(--color-brand-border)]
                bg-white px-5 py-4 text-[var(--color-brand-text)]
                placeholder:text-[color-mix(in_oklab,var(--color-brand-bluegray)_75%,white)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]
              "
            />

            <button
              type="submit"
              disabled={loading}
              className="
                w-full mt-2 inline-flex items-center justify-center gap-3
                rounded-2xl px-5 py-4
                bg-[var(--color-brand-primary)]
                text-white hover:brightness-95 active:brightness-90
                transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              <ColorEmoji emoji="➡️" />
              Enviar enlace
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="
                w-full inline-flex items-center justify-center gap-2 mt-2
                rounded-2xl px-5 py-3 border border-[var(--color-brand-border)]
                bg-white hover:bg-[color-mix(in_oklab,#fff_90%,var(--color-brand-primary)_0%)]
                text-[var(--color-brand-text)]
                transition
              "
            >
              <ColorEmoji emoji="↩️" />
              Volver a Iniciar sesión
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="px-7 md:px-10 py-8 space-y-6">
            <div>
              <label className="block text-[var(--color-brand-text)] font-medium mb-1">
                <span className="inline-flex items-center gap-2">
                  <ColorEmoji emoji="🧩" />
                  Nueva contraseña
                </span>
              </label>
              <input
                type="password"
                required
                value={pwd1}
                onChange={(e) => setPwd1(e.target.value)}
                className="
                  w-full rounded-2xl border border-[var(--color-brand-border)]
                  bg-white px-5 py-4 text-[var(--color-brand-text)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]
                "
              />
            </div>

            <div>
              <label className="block text-[var(--color-brand-text)] font-medium mb-1">
                <span className="inline-flex items-center gap-2">
                  <ColorEmoji emoji="🧩" />
                  Confirmar contraseña
                </span>
              </label>
              <input
                type="password"
                required
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                className="
                  w-full rounded-2xl border border-[var(--color-brand-border)]
                  bg-white px-5 py-4 text-[var(--color-brand-text)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]
                "
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                w-full mt-2 inline-flex items-center justify-center gap-3
                rounded-2xl px-5 py-4
                bg-[var(--color-brand-primary)]
                text-white hover:brightness-95 active:brightness-90
                transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              <ColorEmoji emoji="✅" />
              Guardar nueva contraseña
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";

function getSiteURL() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export default function ResetPasswordRequestPage() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const em = email.trim();
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(em)) {
      showToast("Ingresa un correo válido.", "error");
      return;
    }
    setSending(true);
    try {
      const redirectTo = `${getSiteURL()}/(auth)/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo });
      if (error) throw error;
      showToast("Te enviamos un enlace para restablecer tu contraseña.", "success");
    } catch (err: any) {
      showToast(err?.message || "No se pudo enviar el enlace.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-[80vh] grid place-items-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl p-3 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="email" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-brand-text)]">Restablecer contraseña</h1>
              <p className="text-sm text-[var(--color-brand-bluegray)]">Te enviaremos un enlace seguro a tu correo.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm text-[var(--color-brand-text)]/80">Correo electrónico</span>
              <input
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder="tucorreo@dominio.com"
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
            </label>
            <button
              disabled={sending}
              className="w-full rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <ColorEmoji token="enviar" size={16} />
              {sending ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>

          <div className="h-px bg-[var(--color-brand-border)]" />

          <div className="text-sm flex justify-between">
            <Link href="/login" className="inline-flex items-center gap-2 text-[var(--color-brand-text)] hover:underline">
              <ColorEmoji token="atras" size={16} /> Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

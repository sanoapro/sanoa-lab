"use client";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";
import { useState } from "react";

export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowser();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/update-password` });
    setLoading(false);
    if (error) {
      showToast(error.message || "No pudimos enviar el enlace.", "error");
      return;
    }
    showToast("Te enviamos un enlace para restablecer tu contraseña.", "success");
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
        <ColorEmoji emoji="📧" size={20} />
        Recuperar acceso
      </h1>

      <form onSubmit={onSubmit} className="space-y-3" aria-busy={loading}>
        <input type="email" name="email" placeholder="Tu correo" required
          className="w-full rounded-md border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-coral)]" />
        <button disabled={loading}
          className="w-full rounded-md bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60">
          {loading ? "Enviando…" : "Enviar enlace"}
        </button>
      </form>
    </div>
  );
}

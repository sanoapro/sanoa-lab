"use client";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import ColorEmoji from "@/components/ColorEmoji";

export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowser();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // 🔧 Ruta correcta en App Router: /update-password (los grupos (auth) no forman parte de la URL)
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/update-password` });
    alert("Revisa tu correo: te enviamos un enlace para restablecer tu contraseña.");
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
        <ColorEmoji emoji="📧" size={20} />
        Recuperar acceso
      </h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input type="email" name="email" placeholder="Tu correo"
          className="w-full rounded-md border border-[var(--color-brand-border)] bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-coral)]" />
        <button className="w-full rounded-md bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90">
          Enviar enlace
        </button>
      </form>
    </div>
  );
}

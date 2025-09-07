"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    setLoading(false);

    if (error) {
      setMsg(error.message);
      toast({
        variant: "error",
        title: "No pudimos iniciar sesión",
        description: error.message,
        emoji: "🛑",
      });
      return;
    }

    toast({
      variant: "success",
      title: "¡Bienvenido!",
      description: "Sesión iniciada correctamente.",
      emoji: "✅",
    });
    router.push("/dashboard");
  }

  async function signInGoogle() {
    setMsg(null);
    setLoading(true);
    // Informamos que habrá redirección
    toast({
      variant: "info",
      title: "Redirigiendo a Google…",
      description: "Completa el inicio de sesión y volverás a Sanoa.",
      emoji: "🌐",
    });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) {
      setMsg(error.message);
      toast({
        variant: "error",
        title: "No pudimos conectar con Google",
        description: error.message,
        emoji: "🛑",
      });
    }
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
          <h1 className="text-4xl md:text-5xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-4">
            <ColorEmoji emoji="🔐" size={40} mode="duotone" />
            Iniciar sesión
          </h1>
          <p className="mt-2 text-[var(--color-brand-bluegray)] text-lg">
            <ColorEmoji emoji="✨" size={20} mode="duotone" className="mr-1" />
            Bienvenido/a a Sanoa
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-7 md:px-10 py-8 space-y-6">
          {/* Email */}
          <label className="block text-[var(--color-brand-text)] font-medium mb-1">
            <span className="inline-flex items-center gap-2">
              {/* Sobre 📧 lo dejamos en nativo como pediste */}
              <ColorEmoji emoji="📧" mode="native" />
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

          {/* Password */}
          <label className="block text-[var(--color-brand-text)] font-medium mb-1 mt-4">
            <span className="inline-flex items-center gap-2">
              <ColorEmoji emoji="🔑" mode="duotone" />
              Contraseña
            </span>
          </label>
          <input
            type="password"
            required
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="
              w-full rounded-2xl border border-[var(--color-brand-border)]
              bg-white px-5 py-4 text-[var(--color-brand-text)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]
            "
          />

          {/* Botón Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full mt-4 inline-flex items-center justify-center gap-3
              rounded-2xl px-5 py-4
              bg-[var(--color-brand-primary)]
              text-white hover:brightness-95 active:brightness-90
              transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            <span className="inline-flex items-center gap-2">
              <ColorEmoji emoji="➡️" mode="native" />
              Entrar
            </span>
          </button>

          {/* Separador */}
          <div className="my-4 h-px w-full bg-[var(--color-brand-border)]" />

          {/* Google */}
          <button
            type="button"
            onClick={signInGoogle}
            disabled={loading}
            className="
              w-full inline-flex items-center justify-center gap-3
              rounded-2xl px-5 py-4
              bg-[color-mix(in_oklab,#fff_70%,var(--color-brand-primary)_0%)]
              text-[var(--color-brand-text)]
              hover:bg-[color-mix(in_oklab,#fff_80%,var(--color-brand-primary)_0%)]
              border border-[var(--color-brand-border)]
              transition disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {/* Mantener nativo para reconocimiento instantáneo */}
            <ColorEmoji emoji="🌐" mode="native" />
            Continuar con Google
          </button>

          {/* Mensaje de fallback (opcional) */}
          {msg && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {msg}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

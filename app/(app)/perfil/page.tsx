"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";
import Emoji from "@/components/Emoji";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error) {
        setMsg(error.message);
      }
      const u = data?.user ?? null;
      setUser(u);
      setLoading(false);

      if (!u) {
        // Si no hay sesión, al login
        router.replace("/login");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const name = useMemo(() => {
    if (!user) return "—";
    return (
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split("@")[0] ||
      "Usuario"
    );
  }, [user]);

  const email = user?.email ?? "—";

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (a + b).toUpperCase();
  }, [name]);

  async function handleSignOut() {
    setSigningOut(true);
    setMsg(null);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="p-6 md:p-10">
        <div
          className="
            rounded-3xl bg-white/95 border border-[var(--color-brand-border)]
            shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-7
            animate-pulse
          "
        >
          <div className="h-6 w-40 bg-[var(--color-brand-background)] rounded mb-4" />
          <div className="h-4 w-64 bg-[var(--color-brand-background)] rounded" />
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // redirigimos en useEffect
  }

  return (
    <main className="p-6 md:p-10 space-y-8">
      {/* Encabezado */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
            <Emoji name="usuario" size={30} />
            Perfil
          </h1>
          <p className="text-[var(--color-brand-bluegray)]">
            Administra tu cuenta y cierra sesión cuando lo necesites.
          </p>
        </div>
      </header>

      {/* Mensajes */}
      {msg && (
        <div
          className="
            rounded-2xl bg-white/95 border border-[var(--color-brand-border)]
            shadow-[0_10px_30px_rgba(0,0,0,0.06)] px-5 py-4 text-[var(--color-brand-text)]
          "
        >
          {msg}
        </div>
      )}

      {/* Tarjeta de perfil */}
      <section
        className="
          w-full max-w-3xl rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]
          bg-white/95 border border-[var(--color-brand-border)]
          overflow-hidden
        "
      >
        {/* Header tarjeta */}
        <div className="px-7 md:px-10 py-7 bg-[linear-gradient(180deg,#fff,rgba(255,255,255,0.7))] flex items-center gap-5">
          {/* Avatar de iniciales */}
          <div
            className="
              shrink-0 w-16 h-16 rounded-2xl
              bg-[var(--color-brand-primary)] text-white
              flex items-center justify-center text-2xl font-semibold
              ring-4 ring-white shadow-sm
            "
            aria-hidden
          >
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-[var(--color-brand-text)]">{name}</h2>
            <p className="text-[var(--color-brand-bluegray)]">{email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="
                inline-flex items-center gap-2 rounded-2xl px-5 py-3
                bg-[var(--color-brand-primary)] text-white
                hover:brightness-95 active:brightness-90 transition shadow-sm
                disabled:opacity-60 disabled:cursor-not-allowed
              "
              title="Cerrar sesión"
            >
              <Emoji name="salir" size={18} />
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-7 md:px-10 py-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="ID de usuario">
              <code className="text-[13px] break-all">{user.id}</code>
            </InfoItem>

            <InfoItem label="Último acceso">
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : "—"}
            </InfoItem>

            <InfoItem label="Confirmación de correo">
              {user.email_confirmed_at
                ? `Confirmado (${new Date(user.email_confirmed_at).toLocaleDateString()})`
                : "Pendiente"}
            </InfoItem>

            <InfoItem label="Proveedor">
              {user.app_metadata?.provider ?? "email"}
            </InfoItem>
          </div>

          {/* Acciones futuras */}
          <div className="rounded-2xl border border-[var(--color-brand-border)] p-5 bg-white/85">
            <p className="text-[var(--color-brand-text)] flex items-center gap-2">
              <Emoji name="info" size={18} />
              Próximamente podrás editar nombre, avatar y preferencias.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============== subcomponentes ============== */

function InfoItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        rounded-2xl border border-[var(--color-brand-border)]
        bg-white/90 px-5 py-4
      "
    >
      <div className="text-sm text-[var(--color-brand-bluegray)]">{label}</div>
      <div className="mt-1 text-[var(--color-brand-text)]">{children}</div>
    </div>
  );
}

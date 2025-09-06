"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
      } else {
        setEmail(session.user.email ?? null);
      }
      setChecking(false);
    });
  }, [router, supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-brand-text">Cargando...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto p-6 rounded-2xl border border-brand-border bg-white/70 shadow">
        <h1 className="font-heading text-2xl md:text-3xl mb-2 text-brand-primary">
          Dashboard
        </h1>
        <p className="mb-4">Bienvenido/a {email ?? ""}</p>
        <Button onClick={handleSignOut} className="bg-brand-primary text-white hover:opacity-90">
          Cerrar sesión
        </Button>
      </div>
    </main>
  );
}

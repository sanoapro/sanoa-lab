// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const supabase = getSupabaseClient(); // ← aquí usamos el cliente
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        setMsg(error.message);
      } else {
        setMsg("Inicio de sesión exitoso. (Luego te redirigiremos al dashboard)");
        // Próximo paso: router.push("/dashboard")
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Error de configuración de Supabase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-brand-border bg-white/70">
        <CardHeader>
          <CardTitle className="font-heading text-brand-primary">
            Iniciar sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                minLength={8}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white hover:opacity-90"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            {msg && (
              <p className="text-sm mt-2" role="status" aria-live="polite">
                {msg}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

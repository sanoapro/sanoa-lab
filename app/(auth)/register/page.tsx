"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
      });
      if (error) {
        setMsg(error.message);
      } else {
        // Si "Confirm email" está desactivado, tendrás sesión inmediata.
        setMsg("Cuenta creada. Redirigiendo al dashboard...");
        router.replace("/dashboard");
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
            Crear cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
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
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white hover:opacity-90"
            >
              {loading ? "Creando..." : "Crear cuenta"}
            </Button>
            {msg && <p className="text-sm mt-2">{msg}</p>}
            <p className="text-sm mt-3">
              ¿Ya tienes cuenta?{" "}
              <a href="/login" className="underline text-brand-primary">
                Inicia sesión
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

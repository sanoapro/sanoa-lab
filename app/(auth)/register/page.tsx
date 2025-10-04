"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supa as supabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
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
      const supabase = supabaseClient;
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
      });
      if (error) {
        setMsg(error.message);
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = data.session ?? sessionData.session ?? null;

        if (session) {
          setMsg("Cuenta creada. Preparando tu tablero…");
          router.replace("/dashboard");
        } else {
          setMsg("Cuenta creada. Revisa tu correo para confirmar tu cuenta antes de acceder.");
        }
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
          <CardTitle className="font-heading text-brand-primary">Crear cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <Field label="Correo" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Contraseña" htmlFor="password" required hint="Mínimo 8 caracteres">
              <Input
                id="password"
                type="password"
                placeholder="********"
                minLength={8}
                value={pass}
                onChange={(e: any) => setPass(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
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

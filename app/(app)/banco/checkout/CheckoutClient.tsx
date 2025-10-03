"use client";

import { useState } from "react";
import OrgInspector from "@/components/shared/OrgInspector";
import { Button } from "@/components/ui/button";

const plans = [
  { id: "mente", label: "Mente Pro" },
  { id: "pulso", label: "Pulso Pro" },
  { id: "equilibrio", label: "Equilibrio Pro" },
  { id: "sonrisa", label: "Sonrisa Pro" },
];

export default function CheckoutClient() {
  const [plan, setPlan] = useState(plans[0].id);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch("/api/bank/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await r.json();
      if (r.ok && data?.url) {
        window.location.href = data.url;
      } else {
        setMsg(data?.message || "No se pudo iniciar el checkout (configura Stripe).");
      }
    } catch {
      setMsg("Error de red.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Sanoa Bank · Checkout</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona un plan para desbloquear módulos Pro.
        </p>
      </div>

      <OrgInspector>
        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <label className="text-sm font-medium">Plan</label>
          <select
            value={plan}
            onChange={(e: any) => setPlan(e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3"
          >
            {plans.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button disabled={loading} onClick={go}>
              {loading ? "Creando sesión…" : "Ir a pagar"}
            </Button>
            <Button variant="outline" asChild>
              <a href="/especialidades">Volver</a>
            </Button>
          </div>
          {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
        </section>
      </OrgInspector>
    </main>
  );
}

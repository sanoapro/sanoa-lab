"use client";

import { useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";

export default function DepositarPage(){
  const [orgId] = useState<string>(() => (typeof window!=='undefined' ? localStorage.getItem('org_id') || '' : ''));
  const [amount, setAmount] = useState<string>("500"); // MXN, por default 500
  const [loading, setLoading] = useState(false);

  async function submit(){
    if (!orgId) return alert("Falta org_id");
    const mxn = Math.round(Number(amount || 0) * 100);
    if (!Number.isFinite(mxn) || mxn < 5000) return alert("Monto mínimo $50.00 MXN");
    setLoading(true);
    try{
      const r = await fetch("/api/billing/stripe/checkout/add-funds", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ org_id: orgId, amount_cents: mxn })
      });
      const j = await r.json();
      if (!r.ok) return alert(j?.error || "Error al crear sesión de pago");
      window.location.href = j.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 md:p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="cargas" size={32} />
          Depositar fondos
        </h1>
        <p className="text-sm text-[var(--color-brand-text)]/80">
          Añade saldo a tu cuenta de Sanoa Bank (MXN).
        </p>
      </header>

      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6 max-w-md">
        <label className="text-sm block mb-2">Monto (MXN)</label>
        <input
          type="number"
          min={50}
          step={10}
          value={amount}
          onChange={e=>setAmount(e.target.value)}
          className="w-full border rounded-xl p-3"
          placeholder="500"
        />
        <button
          disabled={loading}
          onClick={submit}
          className="mt-4 px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 text-sm"
        >
          {loading ? "Redirigiendo…" : "Continuar al pago"}
        </button>
      </section>
    </main>
  );
}

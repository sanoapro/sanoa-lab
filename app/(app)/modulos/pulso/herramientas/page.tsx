"use client";

import { useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";
import AccentHeader from "@/components/ui/AccentHeader";

type Interaction = {
  drugA: string;
  drugB: string;
  severity?: string;
  note?: string;
};

export default function HerramientasPulso() {
  const [text, setText] = useState("ibuprofeno, losartán, sertralina");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Interaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/prescriptions/check-interactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: text
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Error al consultar interacciones");
      setResult(j?.data || []);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 md:p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="agenda" size={32} />
          Pulso · Herramientas
        </h1>
        <p className="text-sm text-[var(--color-brand-text)]/80">
          Interacciones fármaco–fármaco y atajos clínicos.
        </p>
      </header>

      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6 space-y-3">
        <AccentHeader emoji="🧰">Interacciones</AccentHeader>
        <label className="text-sm">
          Lista de fármacos (separados por coma)
          <textarea
            className="w-full border rounded-xl p-3 mt-1"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="paracetamol, amoxicilina, claritromicina"
          />
        </label>
        <button
          onClick={check}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-black text-white text-sm hover:opacity-90 active:opacity-80 disabled:opacity-50"
        >
          {loading ? "Consultando…" : "Consultar interacciones"}
        </button>

        {error && <div className="text-sm text-rose-600">{error}</div>}

        {result && (
          <div className="rounded-2xl border p-3">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-brand-background)]">
                <tr>
                  <th className="text-left p-2">A</th>
                  <th className="text-left p-2">B</th>
                  <th className="text-left p-2">Severidad</th>
                  <th className="text-left p-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {result.length === 0 && (
                  <tr>
                    <td className="p-2 text-[var(--color-brand-text)]/60" colSpan={4}>
                      Sin interacciones relevantes.
                    </td>
                  </tr>
                )}
                {result.map((x, i) => (
                  <tr key={i} className="border-t border-[var(--color-brand-border)]">
                    <td className="p-2">{x.drugA}</td>
                    <td className="p-2">{x.drugB}</td>
                    <td className="p-2">{x.severity || "—"}</td>
                    <td className="p-2">{x.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="text-xs text-[var(--color-brand-text)]/60">
        Esta herramienta es de apoyo. Verifica referencias y guías vigentes.
      </section>
    </main>
  );
}

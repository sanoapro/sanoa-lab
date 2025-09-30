"use client";

import { useEffect, useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";

export default function BancoAjustesPage() {
  const [orgId] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("org_id") || "" : "",
  );
  const [threshold, setTh] = useState<string>("0");
  const [channel, setCh] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [to, setTo] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!orgId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/bank/settings?org_id=${orgId}`);
      const j = await r.json();
      const d = j?.data || {};
      setTh(String((d.low_balance_threshold_cents || 0) / 100));
      setCh((d.notify_channel || "whatsapp") as any);
      setTo(d.notify_to || "");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [orgId]);

  async function save() {
    if (!orgId) return alert("Falta org_id");
    setSaving(true);
    try {
      const cents = Math.max(0, Math.round(Number(threshold || 0) * 100));
      const r = await fetch("/api/bank/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          low_balance_threshold_cents: cents,
          notify_channel: channel,
          notify_to: to,
        }),
      });
      const j = await r.json();
      if (!r.ok) return alert(j?.error || "No se pudo guardar");
      alert("Ajustes guardados");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 md:p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="perfil" size={32} />
          Sanoa Bank · Ajustes
        </h1>
        <p className="text-sm text-[var(--color-brand-text)]/80">
          Configura alertas de saldo bajo y el canal de notificación.
        </p>
      </header>

      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6 max-w-xl">
        {loading ? (
          <div className="opacity-70 text-sm">Cargando…</div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <div className="text-sm">Umbral de saldo (MXN)</div>
              <input
                type="number"
                min={0}
                step={10}
                value={threshold}
                onChange={(e) => setTh(e.target.value)}
                className="border rounded-xl p-2 w-full"
              />
              <div className="text-xs opacity-70">
                Se alertará cuando el saldo total sea menor a este monto.
              </div>
            </label>
            <label className="block">
              <div className="text-sm">Canal</div>
              <select
                value={channel}
                onChange={(e) => setCh(e.target.value as any)}
                className="border rounded-xl p-2 w-full"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </label>
            <label className="block">
              <div className="text-sm">Destino (tel/wa/email)</div>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border rounded-xl p-2 w-full"
                placeholder="+52..."
              />
            </label>
            <button
              disabled={saving}
              onClick={save}
              className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        )}
      </section>

      <section className="text-xs text-[var(--color-brand-text)]/60">
        Programa el chequeo automático (cron) en <code>/api/bank/alerts/run</code>.
      </section>
    </main>
  );
}

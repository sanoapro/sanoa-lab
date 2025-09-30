"use client";

import { useEffect, useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";

const MODULES: Array<{
  key: string;
  label: string;
  desc: string;
  token: string;
  checkoutEndpoint?: string;
}> = [
  {
    key: "mente",
    label: "Mente Pro",
    desc: "Evaluaciones clínicas, notas SOAP y seguimiento emocional.",
    token: "mente",
    checkoutEndpoint: "/api/billing/stripe/checkout/mente",
  },
  {
    key: "equilibrio",
    label: "Equilibrio Pro",
    desc: "Planes de hábitos, ejercicios y check-ins automatizados.",
    token: "equilibrio",
    checkoutEndpoint: "/api/billing/stripe/checkout/equilibrio",
  },
  {
    key: "sonrisa",
    label: "Sonrisa Pro",
    desc: "Odontograma digital, presupuestos y firmas electrónicas.",
    token: "sonrisa",
    checkoutEndpoint: "/api/billing/stripe/checkout/sonrisa",
  },
];

export default function BancoAjustesPage() {
  const [orgId] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("org_id") || "" : "",
  );
  const [threshold, setTh] = useState<string>("0");
  const [channel, setCh] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [to, setTo] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modulesMap, setModulesMap] = useState<Record<string, boolean>>({});
  const [modulesActive, setModulesActive] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

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

  async function loadModules() {
    if (!orgId) {
      setLoadingModules(false);
      return;
    }
    setLoadingModules(true);
    try {
      const params = new URLSearchParams({ org_id: orgId });
      const r = await fetch(`/api/billing/subscription/status?${params.toString()}`, {
        cache: "no-store",
      });
      const j = await r.json().catch(() => null);
      const modules = (j?.data?.modules as Record<string, boolean> | undefined) || {};
      setModulesMap(modules);
      setModulesActive(Boolean(j?.data?.active));
    } finally {
      setLoadingModules(false);
    }
  }
  useEffect(() => {
    load();
    loadModules();
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

  async function goToCheckout(moduleKey: string) {
    if (!orgId) {
      alert("Selecciona una organización activa");
      return;
    }
    const def = MODULES.find((m) => m.key === moduleKey);
    if (!def) return;

    if (!def.checkoutEndpoint) {
      window.location.href = "/ajustes/plan";
      return;
    }

    setCheckoutLoading(moduleKey);
    try {
      const res = await fetch(def.checkoutEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ org_id: orgId }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.url) {
        alert(j?.error || "No se pudo iniciar el checkout");
        return;
      }
      window.location.href = j.url as string;
    } finally {
      setCheckoutLoading(null);
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

      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-brand-text)]">Módulos conectados</h2>
            <p className="text-sm text-[var(--color-brand-text)]/70">
              Revisa qué especialidades están activas y lanza el checkout de Stripe sin salir de Bank.
            </p>
          </div>
          <button
            onClick={loadModules}
            disabled={loadingModules}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] bg-white/80 px-3 py-2 text-sm font-medium text-[var(--color-brand-text)] transition hover:bg-white disabled:opacity-60 dark:bg-slate-900/50 dark:hover:bg-slate-900/70"
          >
            {loadingModules ? "Actualizando…" : "Actualizar estado"}
          </button>
        </div>

        <div className="space-y-3">
          {MODULES.map((module) => {
            const active = modulesActive && Boolean(modulesMap[module.key]);
            return (
              <div
                key={module.key}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--color-brand-border)] bg-white/80 p-4 dark:bg-slate-900/40"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-grid h-12 w-12 place-content-center rounded-2xl border border-[var(--color-brand-border)] bg-white/90 text-3xl dark:bg-slate-900/40">
                    <ColorEmoji token={module.token} className="text-3xl" />
                  </span>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-[var(--color-brand-text)]">
                      {module.label}
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          active
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {active ? "Activo" : "Pendiente"}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-brand-text)]/70 dark:text-slate-100/80">{module.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                      active ? "bg-emerald-500/80" : "bg-slate-300/70 dark:bg-slate-700/70"
                    }`}
                    aria-hidden
                  >
                    <span
                      className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition ${
                        active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </span>
                  {active ? (
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-300">Activo</span>
                  ) : (
                    <button
                      onClick={() => goToCheckout(module.key)}
                      disabled={checkoutLoading === module.key || loadingModules}
                      className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      <ColorEmoji token="banco" className="text-lg" />
                      {checkoutLoading === module.key ? "Abriendo…" : "Ir a checkout"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {!loadingModules && MODULES.every((m) => modulesMap[m.key] === undefined) && (
            <p className="rounded-2xl border border-dashed border-[var(--color-brand-border)] bg-white/70 p-4 text-sm text-[var(--color-brand-text)]/70 dark:bg-slate-900/40">
              Aún no hay módulos configurados para esta organización. Completa un checkout para activarlos al instante.
            </p>
          )}
        </div>
      </section>

      <section className="text-xs text-[var(--color-brand-text)]/60">
        Programa el chequeo automático (cron) en <code>/api/bank/alerts/run</code>.
      </section>
    </main>
  );
}

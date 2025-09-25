"use client";

import { useEffect, useMemo, useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";

type Status = {
  stripe_status?: string | null;
  current_period_end?: string | null;
  stripe_customer_id?: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  trialing: "bg-sky-100 text-sky-800 border-sky-200",
  past_due: "bg-amber-100 text-amber-800 border-amber-200",
  canceled: "bg-rose-100 text-rose-800 border-rose-200",
  incomplete: "bg-slate-100 text-slate-800 border-slate-200",
  unpaid: "bg-rose-100 text-rose-800 border-rose-200",
  paused: "bg-amber-100 text-amber-800 border-amber-200",
};

export default function PlanPage() {
  const [orgId] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("org_id") || "" : ""
  );
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status | null>(null);
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);

  async function load() {
    if (!orgId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/billing/subscription/status?org_id=${orgId}`);
      const j = await r.json();
      setStatus(j?.data || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [orgId]);

  const human = useMemo(() => {
    const st = (status?.stripe_status || "incomplete").toLowerCase();
    const cls = STATUS_STYLE[st] || STATUS_STYLE["incomplete"];
    const until =
      status?.current_period_end &&
      new Date(status.current_period_end).toLocaleString();
    return { st, cls, until };
  }, [status]);

  async function buy(target: "MENTE" | "SONRISA" | "EQUILIBRIO") {
    if (!orgId) return alert("Falta org_id");
    setLoadingBtn(target);
    try {
      const url = {
        MENTE: "/api/billing/stripe/checkout/mente",
        SONRISA: "/api/billing/stripe/checkout/sonrisa",
        EQUILIBRIO: "/api/billing/stripe/checkout/equilibrio",
      }[target];

      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ org_id: orgId }),
      });
      const j = await r.json();
      if (!r.ok) return alert(j?.error || "Error en checkout");
      window.location.href = j.url;
    } finally {
      setLoadingBtn(null);
    }
  }

  return (
    <main className="p-6 md:p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-brand-text)] tracking-tight flex items-center gap-3">
          <ColorEmoji token="perfil" size={32} />
          Plan y facturación
        </h1>
        <p className="text-sm text-[var(--color-brand-text)]/80">
          Activa módulos Pro para tu organización. Los accesos se habilitan
          automáticamente al completar el pago.
        </p>
      </header>

      {/* Estado actual */}
      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl p-3 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <ColorEmoji token="tablero" size={22} />
            </span>
            <div>
              <div className="text-sm text-[var(--color-brand-text)]/70">
                Estado de suscripción
              </div>
              {loading ? (
                <div className="text-lg font-semibold text-[var(--color-brand-text)]">
                  Cargando…
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "text-xs font-medium px-2 py-1 rounded-full border",
                      human.cls,
                    ].join(" ")}
                    title={status?.stripe_customer_id || ""}
                  >
                    {human.st}
                  </span>
                  {human.until && (
                    <span className="text-xs text-[var(--color-brand-text)]/60">
                      · periodo hasta {human.until}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={load}
            className="px-3 py-2 rounded-xl border border-[var(--color-brand-border)] hover:bg-slate-50 transition text-sm"
          >
            Actualizar estado
          </button>
        </div>
      </section>

      {/* Planes */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PlanCard
          title="🧠 Mente Pro"
          desc="Evaluaciones clínicas avanzadas"
          onClick={() => buy("MENTE")}
          loading={loadingBtn === "MENTE"}
        />
        <PlanCard
          title="😁 Sonrisa Pro"
          desc="Odontograma + Presupuestos"
          onClick={() => buy("SONRISA")}
          loading={loadingBtn === "SONRISA"}
        />
        <PlanCard
          title="🧘 Equilibrio Pro"
          desc="Sesiones SOAP + Plan de ejercicios"
          onClick={() => buy("EQUILIBRIO")}
          loading={loadingBtn === "EQUILIBRIO"}
        />
      </section>

      <section className="text-xs text-[var(--color-brand-text)]/60 space-y-1">
        <div>
          Gestiona tus depósitos y movimientos en{" "}
          <a href="/banco" className="underline">Sanoa Bank</a>.
        </div>
      </section>
    </main>
  );
}

function PlanCard({
  title,
  desc,
  onClick,
  loading,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <div className="group rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="p-6 space-y-2">
        <div className="text-lg font-semibold text-[var(--color-brand-text)]">{title}</div>
        <div className="text-sm text-[var(--color-brand-bluegray)]">{desc}</div>
      </div>
      <div className="h-px bg-[var(--color-brand-border)] mx-6" />
      <div className="p-6">
        <button
          disabled={loading}
          onClick={onClick}
          className="px-3 py-2 rounded-xl bg-black text-white hover:opacity-90 active:opacity-80 transition disabled:opacity-50 text-sm"
        >
          {loading ? "Redirigiendo…" : "Comprar"}
        </button>
      </div>
    </div>
  );
}

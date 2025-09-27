import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";

function cents(n: number) {
  return (n / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function BancoPage() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Sanoa Bank"
        subtitle="Centraliza tu saldo, depósitos, pagos y suscripciones."
        emojiToken="banco"
      />

      {/* Accesos rápidos a vistas clave */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/banco/tx"
          className="rounded-3xl bg-white/95 border p-6 hover:shadow-sm transition"
        >
          <h3 className="font-semibold inline-flex items-center gap-2">
            <ColorEmoji token="banco" /> Transacciones
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Explora, filtra y exporta tus movimientos. Acciones masivas y conciliación.
          </p>
          <span className="inline-flex mt-3 px-3 py-1.5 rounded-lg border text-sm">Abrir tabla</span>
        </Link>

        <Link
          href="/banco/reglas"
          className="rounded-3xl bg-white/95 border p-6 hover:shadow-sm transition"
        >
          <h3 className="font-semibold inline-flex items-center gap-2">
            <ColorEmoji token="carpeta" /> Reglas
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Clasificación automática por texto, categoría y tags con prioridad.
          </p>
          <span className="inline-flex mt-3 px-3 py-1.5 rounded-lg border text-sm">Gestionar reglas</span>
        </Link>

        <Link
          href="/banco/presupuestos"
          className="rounded-3xl bg-white/95 border p-6 hover:shadow-sm transition"
        >
          <h3 className="font-semibold inline-flex items-center gap-2">
            <ColorEmoji token="plan" /> Presupuestos
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Define montos por categoría y mes para controlar desvíos.
          </p>
          <span className="inline-flex mt-3 px-3 py-1.5 rounded-lg border text-sm">Configurar mes</span>
        </Link>
      </section>

      {/* Tarjetas existentes (saldo, suscripciones, reportes) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-white/95 border p-6">
          <h3 className="font-semibold">Saldo</h3>
          <p className="mt-2 text-3xl tracking-tight">{cents(0)}</p>
          <p className="text-sm text-slate-500 mt-1">
            Disponible para compras de módulos y créditos de mensajes.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/banco/ajustes"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white"
            >
              <ColorEmoji token="ajustes" /> Ajustes
            </Link>
            <Link
              href="/api/billing/stripe/checkout/add-funds"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border"
            >
              <ColorEmoji token="pago" /> Añadir fondos
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-white/95 border p-6">
          <h3 className="font-semibold">Suscripciones</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>🔹 Mente — activo / por activar</li>
            <li>🔹 Pulso — activo / por activar</li>
            <li>🔹 Sonrisa — activo / por activar</li>
            <li>🔹 Equilibrio — activo / por activar</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/banco/ajustes" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border">
              <ColorEmoji token="ajustes" /> Gestionar
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-white/95 border p-6">
          <h3 className="font-semibold">Reportes</h3>
          <p className="text-sm text-slate-500 mt-2">Exporta movimientos y conciliaciones.</p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/api/bank/ledger/export"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border"
            >
              <ColorEmoji token="exportar" /> Exportar CSV
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

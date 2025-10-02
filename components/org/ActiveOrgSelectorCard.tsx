"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/Toaster";
import { listMyOrgs, setCurrentOrgId, type MyOrg } from "@/lib/org";
import { setActiveOrg } from "@/lib/org-local";

function cn(base: string, extra?: string) {
  return extra ? `${base} ${extra}` : base;
}

export default function ActiveOrgSelectorCard({ className }: { className?: string }) {
  const [orgs, setOrgs] = useState<MyOrg[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listMyOrgs();
        if (!alive) return;
        setOrgs(list);
        setSelected(list[0]?.id ?? "");
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar tus organizaciones.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function activate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    const org = orgs.find((o) => o.id === selected) || null;
    try {
      setActiveOrg(selected, org?.name ?? null);
      try {
        await setCurrentOrgId(selected);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[ActiveOrgSelector] setCurrentOrgId failed", err);
      }
      showToast({
        title: "Organización activada",
        description: org?.name,
        variant: "success",
      });
      window.location.reload();
    } catch (err) {
      showToast({
        title: "No se pudo activar",
        description: err instanceof Error ? err.message : String(err ?? ""),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const wrapperClass = cn(
    "rounded-3xl border border-[var(--color-brand-border)] bg-white/95 dark:bg-white/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
    className,
  );

  return (
    <section className={wrapperClass}>
      <div className="p-6 space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
            <ColorEmoji token="banco" size={18} /> Selecciona una organización
          </h2>
          <p className="text-sm text-[var(--color-brand-bluegray)]">
            Activa una organización para desbloquear esta sección.
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-[var(--color-brand-bluegray)]">Cargando organizaciones…</p>
        ) : error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        ) : orgs.length === 0 ? (
          <p className="text-sm text-[var(--color-brand-bluegray)]">
            Aún no tienes organizaciones. Puedes crear una en {""}
            <Link href="/organizaciones" className="underline underline-offset-4 font-medium">
              Organizaciones
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={activate} className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <label className="flex-1 text-sm text-[var(--color-brand-text)]">
              <span className="mb-1 block text-[var(--color-brand-bluegray)]">Elige organización</span>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3 text-[var(--color-brand-text)] dark:bg-slate-900"
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.is_personal ? "Personal" : o.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-3">
              <ColorEmoji token="guardar" size={16} />
              {saving ? "Activando…" : "Activar"}
            </Button>
          </form>
        )}

        <p className="text-xs text-[var(--color-brand-bluegray)]">
          El contenido del banco usa tu organización activa para filtrar datos y exportaciones.
        </p>
      </div>
    </section>
  );
}

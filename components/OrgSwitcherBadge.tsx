"use client";
import { useEffect, useState } from "react";
import { listMyOrgs, getCurrentOrgId, setCurrentOrgId, type MyOrg } from "@/lib/org";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";

type OrgSwitcherBadgeProps = {
  variant?: "fixed" | "inline";
};

export default function OrgSwitcherBadge({ variant = "fixed" }: OrgSwitcherBadgeProps) {
  const [orgs, setOrgs] = useState<MyOrg[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [list, cur] = await Promise.all([listMyOrgs(), getCurrentOrgId()]);
        setOrgs(list);
        setCurrent(cur);
      } catch (e) {
        // silencioso
      }
    })();

    const onChanged = (e: any) => setCurrent(e.detail?.orgId || null);
    window.addEventListener("sanoa:org-changed", onChanged);
    return () => window.removeEventListener("sanoa:org-changed", onChanged);
  }, []);

  if (variant !== "inline" && orgs.length <= 1) return null;

  const cur = orgs.find((o: any) => o.id === current);
  const label = cur ? (cur.is_personal ? "Personal" : cur.name) : "Selecciona organización";

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setCurrent(v);
    try {
      await setCurrentOrgId(v);
      showToast("Organización cambiada.", "success");
      // Opcional: refresca la página para que queries lean nueva org_id por triggers
      // location.reload();
    } catch (err: any) {
      showToast(err?.message || "No se pudo cambiar la organización.", "error");
    }
    setOpen(false);
  }

  if (variant === "inline") {
    if (orgs.length === 0) {
      return (
        <div className="flex w-full flex-col gap-1 rounded-xl border border-dashed border-[var(--color-brand-border)] bg-white/70 p-3 text-sm text-slate-500">
          No tienes organizaciones disponibles todavía.
        </div>
      );
    }

    const value = cur ? cur.id : "";

    return (
      <div className="flex w-full flex-col gap-2">
        <label className="text-sm font-medium text-slate-600">Organización</label>
        <div className="flex items-center gap-2">
          <ColorEmoji token="laboratorio" size={16} />
          <select
            value={value}
            onChange={onChange}
            className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 text-sm"
          >
            {!cur && (
              <option value="" disabled>
                Selecciona organización…
              </option>
            )}
            {orgs.map((o: any) => (
              <option key={o.id} value={o.id}>
                {o.is_personal ? "Personal" : o.name} {o.role !== "owner" ? `· ${o.role}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
      <div className="rounded-full border border-[var(--color-brand-border)] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] px-3 py-1.5">
        <button
          data-org-switcher=""
          onClick={() => setOpen((v: any) => !v)}
          className="inline-flex items-center gap-2 text-sm"
        >
          <ColorEmoji token="laboratorio" size={16} />
          <span className="max-w-[180px] truncate">{label}</span>
          <span aria-hidden>▾</span>
        </button>
      </div>
      {open && (
        <div className="absolute mt-10 right-0 w-[260px] rounded-2xl border border-[var(--color-brand-border)] bg-white shadow-lg p-2">
          <select
            value={current ?? ""}
            onChange={onChange}
            className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Selecciona organización…
            </option>
            {orgs.map((o: any) => (
              <option key={o.id} value={o.id}>
                {o.is_personal ? "Personal" : o.name} {o.role !== "owner" ? `· ${o.role}` : ""}
              </option>
            ))}
          </select>
          <div className="pt-2 text-[11px] text-[var(--color-brand-bluegray)]">
            Cambia para trabajar en otra organización.
          </div>
        </div>
      )}
    </div>
  );
}

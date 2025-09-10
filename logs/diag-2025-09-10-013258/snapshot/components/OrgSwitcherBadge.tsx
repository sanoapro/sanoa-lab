"use client";
import { useEffect, useState } from "react";
import { listMyOrgs, getCurrentOrgId, setCurrentOrgId, type MyOrg } from "@/lib/org";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";

export default function OrgSwitcherBadge() {
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

  if (!current || orgs.length <= 1) return null;

  const cur = orgs.find((o) => o.id === current);
  const label = cur ? (cur.is_personal ? "Personal" : cur.name) : "Organización";

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setCurrent(v);
    try {
      await setCurrentOrgId(v);
      showToast("Organización cambiada.", "success");
      // Opcional: refresca la página para que queries lean nueva org_id por triggers
      // location.reload();
    } catch (err: unknown) {
      showToast(err?.message || "No se pudo cambiar la organización.", "error");
    }
    setOpen(false);
  }

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
      <div className="rounded-full border border-[var(--color-brand-border)] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] px-3 py-1.5">
        <button
          onClick={() => setOpen((v) => !v)}
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
            {orgs.map((o) => (
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

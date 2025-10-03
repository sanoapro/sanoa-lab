"use client";

import * as React from "react";
import GlassModal from "@/components/ui/GlassModal";
import { listMyOrgs, getCurrentOrgId, setCurrentOrgId, type MyOrg } from "@/lib/org";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";

export default function ActiveOrgInspector() {
  const [open, setOpen] = React.useState(false);
  const [orgs, setOrgs] = React.useState<MyOrg[]>([]);
  const [current, setCurrent] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [changing, setChanging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, cur] = await Promise.all([listMyOrgs(), getCurrentOrgId()]);
      setOrgs(list);
      setCurrent(cur);
      setLoading(false);
      return list;
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "No pudimos cargar tus organizaciones");
      setLoading(false);
      return [] as MyOrg[];
    }
  }, []);

  React.useEffect(() => {
    load();
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.orgId) setCurrent(detail.orgId);
    };
    window.addEventListener("sanoa:org-changed", onChanged);
    return () => window.removeEventListener("sanoa:org-changed", onChanged);
  }, [load]);

  const activeOrg = React.useMemo(() => orgs.find((org: any) => org.id === current) ?? null, [orgs, current]);

  const handleChange = async (nextId: string) => {
    setChanging(true);
    try {
      await setCurrentOrgId(nextId);
      setCurrent(nextId);
      showToast("Organización actualizada", "success");
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "No pudimos cambiar la organización", "error");
    } finally {
      setChanging(false);
    }
  };

  return (
    <>
      <button className="glass-btn text-sm" onClick={() => setOpen(true)}>
        <span className="emoji" aria-hidden>
          🏢
        </span>
        {activeOrg ? activeOrg.name : "Organización"}
      </button>

      <GlassModal
        open={open}
        onClose={() => setOpen(false)}
        size="md"
        title="Organización activa"
        footer={
          loading ? <span className="text-sm text-slate-500">Cargando…</span> : null
        }
      >
        <div className="space-y-4">
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

          {activeOrg ? (
            <div className="rounded-2xl border border-white/20 bg-white/80 p-4 shadow-sm dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <ColorEmoji token={activeOrg.is_personal ? "estrella" : "laboratorio"} size={32} />
                <div>
                  <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{activeOrg.name}</div>
                  <div className="text-sm text-slate-500">
                    Rol: {activeOrg.role}
                    {activeOrg.is_personal ? " · Espacio personal" : ""}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/30 bg-white/60 p-4 text-sm text-slate-500 dark:bg-slate-950/30">
              No hay organización seleccionada.
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-slate-600">Cambiar organización</h4>
            <div className="mt-2 space-y-2">
              {orgs.map((org: any) => {
                const isActive = org.id === current;
                return (
                  <button
                    key={org.id}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? "border-sky-400/60 bg-sky-50 text-sky-900 dark:border-sky-500/40 dark:bg-sky-950/40 dark:text-sky-100"
                        : "border-white/30 bg-white/80 hover:border-sky-200 hover:bg-white dark:border-slate-800/40 dark:bg-slate-950/40 dark:hover:border-sky-500/40"
                    }`}
                    onClick={() => handleChange(org.id)}
                    disabled={changing || isActive}
                  >
                    <div className="font-medium">{org.name}</div>
                    <div className="text-xs text-slate-500">
                      {org.is_personal ? "Espacio personal" : `Rol: ${org.role}`}
                    </div>
                  </button>
                );
              })}
              {!orgs.length && !loading && (
                <div className="rounded-xl border border-dashed border-white/40 bg-white/60 p-3 text-sm text-slate-500 dark:bg-slate-950/40">
                  No perteneces a ninguna organización todavía.
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassModal>
    </>
  );
}

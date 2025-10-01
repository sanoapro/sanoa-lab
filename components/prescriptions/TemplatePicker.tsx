"use client";

import * as React from "react";
import TemplateLibraryModal from "@/components/templates/TemplateLibraryModal";
import { listPrescriptionTemplates } from "@/lib/prescriptions/templates";

type TemplateSummary = { id: string; name: string; active?: boolean | null; specialty?: string | null };

type Props = {
  orgId: string;
  mine?: boolean;
  onChoose: (tpl: TemplateSummary) => void;
};

export default function TemplatePicker({ orgId, onChoose }: Props) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<TemplateSummary[]>([]);

  const load = React.useCallback(async () => {
    if (!orgId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const data = await listPrescriptionTemplates(orgId);
      setRows(
        data
          .filter((tpl) => tpl.is_active !== false)
          .map((tpl) => ({
            id: tpl.id,
            name: tpl.name,
            active: tpl.is_active,
            specialty: tpl.content?.meta?.specialty ?? null,
          })),
      );
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleUse = React.useCallback(
    (tpl: { id: string; name: string }) => {
      onChoose({ id: tpl.id, name: tpl.name });
      setOpen(false);
      load();
    },
    [onChoose, load],
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-lg font-semibold">Plantillas disponibles</h4>
          <p className="text-sm text-slate-500">Selecciona o administra tus plantillas de receta.</p>
        </div>
        <button className="glass-btn" onClick={() => setOpen(true)}>
          📚 Administrar
        </button>
      </div>

      <div className="rounded-2xl border border-white/30 bg-white/80 p-3 dark:bg-slate-950/40">
        <ul className="space-y-2">
          {rows.map((tpl) => (
            <li key={tpl.id} className="flex items-center justify-between rounded-xl bg-white/90 px-3 py-2 text-sm shadow-sm dark:bg-slate-900/60">
              <div>
                <div className="font-medium text-slate-700 dark:text-slate-100">{tpl.name}</div>
                {tpl.specialty ? (
                  <div className="text-xs text-slate-500">{tpl.specialty}</div>
                ) : null}
              </div>
              <button className="glass-btn text-xs" onClick={() => onChoose(tpl)}>
                Usar
              </button>
            </li>
          ))}
          {!rows.length && (
            <li className="rounded-xl bg-white/90 px-3 py-4 text-center text-sm text-slate-500 dark:bg-slate-900/60">
              {loading ? "Cargando…" : "Aún no tienes plantillas activas"}
            </li>
          )}
        </ul>
      </div>

      <TemplateLibraryModal
        kind="prescription"
        orgId={orgId}
        open={open}
        onClose={() => {
          setOpen(false);
          load();
        }}
        onUse={handleUse}
      />
    </section>
  );
}

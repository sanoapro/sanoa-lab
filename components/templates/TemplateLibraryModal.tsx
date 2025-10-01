"use client";

import * as React from "react";
import GlassModal from "@/components/ui/GlassModal";
import {
  listPrescriptionTemplates,
  upsertPrescriptionTemplate,
  togglePrescriptionTemplate,
  deletePrescriptionTemplate,
  type PrescriptionTemplate,
  type PrescriptionTemplateContent,
} from "@/lib/prescriptions/templates";
import {
  listReferralTemplates,
  upsertReferralTemplate,
  toggleReferralTemplate,
  deleteReferralTemplate,
  type ReferralTemplate,
  type ReferralTemplateContent,
} from "@/lib/referrals/templates";
import { getCatalogByType, type CatalogTemplate } from "@/lib/templates/catalog";
import { showToast } from "@/components/Toaster";
import { cn } from "@/lib/utils";

export type TemplateKind = "prescription" | "referral";

type CommonDraft = {
  id?: string;
  org_id: string;
  name: string;
  is_active: boolean;
  metaSpecialty: string;
  metaSummary: string;
};

type PrescriptionDraft = CommonDraft & {
  type: "prescription";
  notes: string;
  items: PrescriptionTemplateContent["items"];
};

type ReferralDraft = CommonDraft & {
  type: "referral";
  to_specialty: string;
  to_doctor_name: string;
  reason: string;
  summary: string;
  plan: string;
};

type Draft = PrescriptionDraft | ReferralDraft;

type TemplateLibraryModalProps = {
  orgId: string;
  kind: TemplateKind;
  open: boolean;
  onClose: () => void;
  onUse?: (_tpl: { id: string; name: string }) => void;
};

type LoadState = "idle" | "loading" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

const PRESCRIPTION_EMPTY_ITEM = {
  drug: "",
  dose: "",
  route: "",
  frequency: "",
  duration: "",
  instructions: "",
};

function templateToDraft(kind: TemplateKind, tpl: PrescriptionTemplate | ReferralTemplate, orgId: string): Draft {
  if (kind === "prescription") {
    const content = tpl.content ?? { items: [] };
    return {
      type: "prescription",
      id: tpl.id,
      org_id: orgId,
      name: tpl.name,
      is_active: tpl.is_active ?? true,
      metaSpecialty: content.meta?.specialty ?? "",
      metaSummary: content.meta?.summary ?? "",
      notes: content.notes ?? "",
      items: Array.isArray(content.items) ? content.items.map((it) => ({ ...PRESCRIPTION_EMPTY_ITEM, ...it })) : [],
    };
  }
  const content = tpl.content ?? {};
  return {
    type: "referral",
    id: tpl.id,
    org_id: orgId,
    name: tpl.name,
    is_active: tpl.is_active ?? true,
    metaSpecialty: content.meta?.specialty ?? "",
    metaSummary: content.meta?.summary ?? "",
    to_specialty: content.to_specialty ?? "",
    to_doctor_name: content.to_doctor_name ?? "",
    reason: content.reason ?? "",
    summary: content.summary ?? "",
    plan: content.plan ?? "",
  };
}

function draftToPayload(draft: Draft) {
  if (draft.type === "prescription") {
    const content: PrescriptionTemplateContent = {
      meta: {
        specialty: draft.metaSpecialty || undefined,
        summary: draft.metaSummary || undefined,
      },
      notes: draft.notes || undefined,
      items: draft.items.map((it) => ({
        drug: it.drug.trim(),
        dose: it.dose.trim(),
        route: it.route.trim(),
        frequency: it.frequency.trim(),
        duration: it.duration.trim(),
        instructions: it.instructions?.trim() || undefined,
      })),
    };
    return {
      id: draft.id,
      org_id: draft.org_id,
      name: draft.name.trim(),
      content,
      is_active: draft.is_active,
    };
  }
  const content: ReferralTemplateContent = {
    meta: {
      specialty: draft.metaSpecialty || undefined,
      summary: draft.metaSummary || undefined,
    },
    to_specialty: draft.to_specialty || undefined,
    to_doctor_name: draft.to_doctor_name || undefined,
    reason: draft.reason || undefined,
    summary: draft.summary || undefined,
    plan: draft.plan || undefined,
  };
  return {
    id: draft.id,
    org_id: draft.org_id,
    name: draft.name.trim(),
    content,
    is_active: draft.is_active,
  };
}

function createEmptyDraft(kind: TemplateKind, orgId: string): Draft {
  if (kind === "prescription") {
    return {
      type: "prescription",
      org_id: orgId,
      name: "Nueva plantilla",
      is_active: true,
      metaSpecialty: "",
      metaSummary: "",
      notes: "",
      items: [{ ...PRESCRIPTION_EMPTY_ITEM }],
    };
  }
  return {
    type: "referral",
    org_id: orgId,
    name: "Nueva plantilla",
    is_active: true,
    metaSpecialty: "",
    metaSummary: "",
    to_specialty: "",
    to_doctor_name: "",
    reason: "",
    summary: "",
    plan: "",
  };
}

export default function TemplateLibraryModal({ orgId, kind, open, onClose, onUse }: TemplateLibraryModalProps) {
  const [loadState, setLoadState] = React.useState<LoadState>("idle");
  const [templates, setTemplates] = React.useState<Array<(PrescriptionTemplate | ReferralTemplate) & { type: TemplateKind }>>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [showCatalog, setShowCatalog] = React.useState(false);
  const saveTimer = React.useRef<NodeJS.Timeout | null>(null);

  const load = React.useCallback(async () => {
    setLoadState("loading");
    try {
      if (kind === "prescription") {
        const rows = await listPrescriptionTemplates(orgId);
        setTemplates(rows.map((r) => ({ ...r, type: "prescription" as const })));
      } else {
        const rows = await listReferralTemplates(orgId);
        setTemplates(rows.map((r) => ({ ...r, type: "referral" as const })));
      }
      setLoadState("idle");
    } catch (err: any) {
      console.error(err);
      setLoadState("error");
      showToast(err?.message || "No pudimos cargar las plantillas", "error");
    }
  }, [kind, orgId]);

  React.useEffect(() => {
    if (open) {
      load();
      setSelectedId(null);
      setDraft(null);
      setSearch("");
      setShowCatalog(false);
    }
  }, [open, load]);

  const currentList = React.useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter((tpl) => {
      const meta = tpl.content?.meta;
      const specialty = meta?.specialty ?? "";
      const metaSummary = meta?.summary ?? "";
      return (
        tpl.name.toLowerCase().includes(q) ||
        specialty.toLowerCase().includes(q) ||
        metaSummary.toLowerCase().includes(q)
      );
    });
  }, [templates, search]);

  const catalog = React.useMemo(() => getCatalogByType(kind), [kind]);

  const scheduleSave = React.useCallback(
    (next: Draft) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaveState("saving");
        setErrorMessage(null);
        try {
          const payload = draftToPayload(next);
          let newId = payload.id;
          if (next.type === "prescription") {
            const res = await upsertPrescriptionTemplate(payload);
            newId = res.id;
          } else {
            const res = await upsertReferralTemplate(payload);
            newId = res.id;
          }
          setSaveState("saved");
          setDirty(false);
          setTemplates((prev) => {
            const updated = prev.filter((tpl) => tpl.id !== payload.id);
            const base = {
              ...payload,
              id: newId,
              content: payload.content,
              type: next.type,
            } as (PrescriptionTemplate | ReferralTemplate) & { type: TemplateKind };
            return [...updated, base].sort((a, b) => a.name.localeCompare(b.name));
          });
          setSelectedId(newId ?? null);
          setDraft((d) => (d ? { ...next, id: newId ?? next.id } : d));
        } catch (err: any) {
          console.error(err);
          setSaveState("error");
          setErrorMessage(err?.message || "No pudimos guardar la plantilla");
          showToast(err?.message || "No pudimos guardar la plantilla", "error");
        }
      }, 900);
    },
    [],
  );

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const onSelectTemplate = (tpl: (PrescriptionTemplate | ReferralTemplate) & { type: TemplateKind }) => {
    setSelectedId(tpl.id);
    setDraft(templateToDraft(tpl.type, tpl as any, orgId));
    setDirty(false);
    setSaveState("idle");
    setErrorMessage(null);
  };

  const onCreateNew = () => {
    const fresh = createEmptyDraft(kind, orgId);
    setSelectedId(null);
    setDraft(fresh);
    setDirty(true);
    setSaveState("idle");
    setErrorMessage(null);
    scheduleSave(fresh);
  };

  const onToggleActive = async (tpl: (PrescriptionTemplate | ReferralTemplate) & { type: TemplateKind }) => {
    const next = !tpl.is_active;
    try {
      if (tpl.type === "prescription") {
        await togglePrescriptionTemplate(tpl.id, next);
      } else {
        await toggleReferralTemplate(tpl.id, next);
      }
      setTemplates((prev) =>
        prev.map((row) => (row.id === tpl.id ? { ...row, is_active: next } : row)),
      );
      if (draft && draft.id === tpl.id) {
        setDraft({ ...draft, is_active: next });
      }
    } catch (err: any) {
      showToast(err?.message || "No pudimos actualizar la plantilla", "error");
    }
  };

  const onDelete = async (tpl: (PrescriptionTemplate | ReferralTemplate) & { type: TemplateKind }) => {
    if (!confirm(`¿Eliminar la plantilla "${tpl.name}"?`)) return;
    try {
      if (tpl.type === "prescription") {
        await deletePrescriptionTemplate(tpl.id);
      } else {
        await deleteReferralTemplate(tpl.id);
      }
      setTemplates((prev) => prev.filter((row) => row.id !== tpl.id));
      if (draft?.id === tpl.id) {
        setDraft(null);
        setSelectedId(null);
      }
      showToast("Plantilla eliminada", "success");
    } catch (err: any) {
      showToast(err?.message || "No pudimos eliminar la plantilla", "error");
    }
  };

  const handleCatalogImport = async (tpl: CatalogTemplate) => {
    try {
      setSaveState("saving");
      if (tpl.type === "prescription") {
        await upsertPrescriptionTemplate({
          org_id: orgId,
          name: tpl.name,
          content: tpl.content,
          is_active: true,
        });
      } else {
        await upsertReferralTemplate({
          org_id: orgId,
          name: tpl.name,
          content: tpl.content,
          is_active: true,
        });
      }
      await load();
      setSaveState("saved");
      showToast("Plantilla agregada desde catálogo", "success");
    } catch (err: any) {
      console.error(err);
      setSaveState("error");
      showToast(err?.message || "No pudimos importar la plantilla", "error");
    }
  };

  const updateDraft = (updater: (_draft: Draft) => Draft) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      setDirty(true);
      scheduleSave(next);
      return next;
    });
  };

  const renderEditor = () => {
    if (!draft) {
      return (
        <div className="rounded-2xl border border-white/20 bg-white/70 p-6 text-sm text-slate-500 dark:bg-slate-950/40">
          Selecciona una plantilla para editarla o crea una nueva.
        </div>
      );
    }
    if (draft.type === "prescription") {
      return (
        <PrescriptionEditorForm
          draft={draft}
          onChange={updateDraft}
          onUse={onUse}
        />
      );
    }
    return <ReferralEditorForm draft={draft} onChange={updateDraft} onUse={onUse} />;
  };

  const statusLabel = React.useMemo(() => {
    if (saveState === "saving") return "Guardando…";
    if (saveState === "saved") return "Cambios guardados";
    if (saveState === "error") return errorMessage ?? "Error al guardar";
    if (dirty) return "Cambios pendientes";
    return "";
  }, [saveState, dirty, errorMessage]);

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      size="lg"
      title={kind === "prescription" ? "Plantillas de recetas" : "Plantillas de referencias"}
      footer={
        statusLabel ? (
          <div
            className={cn("text-sm", saveState === "error" ? "text-rose-500" : "text-slate-500")}
            aria-live="polite"
          >
            {statusLabel}
          </div>
        ) : null
      }
    >
      <div className="grid gap-5 md:grid-cols-[280px,1fr]">
        <aside className="space-y-4">
          <div className="space-y-2">
            <input
              className="w-full rounded-xl border border-white/30 bg-white/80 px-3 py-2 text-sm shadow-inner focus:border-sky-400"
              placeholder="Buscar por nombre o especialidad"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <button className="glass-btn text-sm" onClick={onCreateNew}>
                ➕ Nueva plantilla
              </button>
              <button className="glass-btn text-sm" onClick={() => setShowCatalog((v) => !v)}>
                📚 {showCatalog ? "Ocultar catálogo" : "Ver catálogo"}
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-2xl border border-white/20 bg-white/70 p-1 dark:bg-slate-950/40">
            <ul>
              {currentList.map((tpl) => {
                const meta = tpl.content?.meta;
                const specialty = meta?.specialty ?? "";
                const isActive = tpl.is_active ?? true;
                const isSelected = tpl.id === selectedId;
                return (
                  <li key={tpl.id}>
                    <button
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                        isSelected
                          ? "bg-sky-500/20 text-sky-900 dark:text-sky-100"
                          : "hover:bg-white/80 dark:hover:bg-slate-900/60",
                      )}
                      onClick={() => onSelectTemplate(tpl)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{tpl.name}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px]",
                            isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                          )}
                        >
                          {isActive ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                      {specialty ? <div className="text-xs text-slate-500">{specialty}</div> : null}
                    </button>
                    {isSelected && (
                      <div className="flex items-center gap-2 px-3 pb-2 text-xs text-slate-500">
                        <button
                          className="glass-btn text-xs"
                          onClick={() => onToggleActive(tpl)}
                        >
                          {tpl.is_active ? "Desactivar" : "Activar"}
                        </button>
                        <button className="glass-btn text-xs" onClick={() => onDelete(tpl)}>
                          Eliminar
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
              {!currentList.length && (
                <li className="px-3 py-6 text-center text-sm text-slate-500">Sin plantillas</li>
              )}
            </ul>
          </div>

          {showCatalog && (
            <div className="space-y-2 rounded-2xl border border-white/20 bg-white/70 p-3 text-xs text-slate-600 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <strong>Catálogo inicial</strong>
                <span>{catalog.length}</span>
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {catalog.map((tpl) => (
                  <article key={tpl.slug} className="rounded-xl border border-white/30 bg-white/80 p-2">
                    <div className="text-sm font-semibold">{tpl.name}</div>
                    <div className="text-[11px] text-slate-500">{tpl.specialty}</div>
                    <div className="mt-1 text-xs text-slate-600">{tpl.summary}</div>
                    <button
                      className="mt-2 glass-btn text-xs"
                      onClick={() => handleCatalogImport(tpl)}
                    >
                      Agregar a mis plantillas
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}

          {loadState === "loading" && (
            <div className="text-xs text-slate-500">Cargando plantillas…</div>
          )}
          {loadState === "error" && (
            <div className="text-xs text-rose-500">Error al cargar plantillas</div>
          )}
        </aside>

        <section className="space-y-4">{renderEditor()}</section>
      </div>
    </GlassModal>
  );
}

type PrescriptionEditorFormProps = {
  draft: PrescriptionDraft;
  onChange: (_updater: (_draft: Draft) => Draft) => void;
  onUse?: TemplateLibraryModalProps["onUse"];
};

function PrescriptionEditorForm({ draft, onChange, onUse }: PrescriptionEditorFormProps) {
  const update = (mutator: (_draft: PrescriptionDraft) => PrescriptionDraft) => {
    onChange((current) => {
      if (current.type !== "prescription") return current;
      return mutator(current);
    });
  };

  const updateItem = (idx: number, key: keyof PrescriptionDraft["items"][number], value: string) => {
    update((cur) => ({
      ...cur,
      items: cur.items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)),
    }));
  };

  const addItem = () => {
    update((cur) => ({
      ...cur,
      items: [...cur.items, { ...PRESCRIPTION_EMPTY_ITEM }],
    }));
  };

  const removeItem = (idx: number) => {
    update((cur) => ({
      ...cur,
      items: cur.items.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Nombre</span>
          <input
            className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
            value={draft.name}
            onChange={(e) => update((cur) => ({ ...cur, name: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Especialidad</span>
          <input
            className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
            value={draft.metaSpecialty}
            onChange={(e) => update((cur) => ({ ...cur, metaSpecialty: e.target.value }))}
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Descripción breve</span>
          <input
            className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
            value={draft.metaSummary}
            onChange={(e) => update((cur) => ({ ...cur, metaSummary: e.target.value }))}
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Notas</span>
          <textarea
            className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
            rows={3}
            value={draft.notes}
            onChange={(e) => update((cur) => ({ ...cur, notes: e.target.value }))}
          />
        </label>
      </div>

      <div className="rounded-2xl border border-white/20 bg-white/70 p-3 shadow-inner dark:bg-slate-950/40">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-slate-700">Fármacos</h4>
          <button className="glass-btn text-sm" onClick={addItem}>
            Añadir fármaco
          </button>
        </div>
        <div className="space-y-3">
          {draft.items.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-white/40 bg-white/80 p-3">
              <div className="grid gap-2 md:grid-cols-3">
                <input
                  className="rounded-lg border border-white/40 bg-white/90 px-2 py-1 text-sm"
                  placeholder="Fármaco"
                  value={item.drug}
                  onChange={(e) => updateItem(idx, "drug", e.target.value)}
                />
                <input
                  className="rounded-lg border border-white/40 bg-white/90 px-2 py-1 text-sm"
                  placeholder="Dosis"
                  value={item.dose}
                  onChange={(e) => updateItem(idx, "dose", e.target.value)}
                />
                <input
                  className="rounded-lg border border-white/40 bg-white/90 px-2 py-1 text-sm"
                  placeholder="Vía"
                  value={item.route}
                  onChange={(e) => updateItem(idx, "route", e.target.value)}
                />
                <input
                  className="rounded-lg border border-white/40 bg-white/90 px-2 py-1 text-sm"
                  placeholder="Frecuencia"
                  value={item.frequency}
                  onChange={(e) => updateItem(idx, "frequency", e.target.value)}
                />
                <input
                  className="rounded-lg border border-white/40 bg-white/90 px-2 py-1 text-sm"
                  placeholder="Duración"
                  value={item.duration}
                  onChange={(e) => updateItem(idx, "duration", e.target.value)}
                />
                <input
                  className="rounded-lg border border-white/40 bg-white/90 px-2 py-1 text-sm"
                  placeholder="Indicaciones"
                  value={item.instructions ?? ""}
                  onChange={(e) => updateItem(idx, "instructions", e.target.value)}
                />
              </div>
              <div className="mt-2 flex justify-end">
                <button className="glass-btn text-xs" onClick={() => removeItem(idx)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {!draft.items.length && <div className="text-sm text-slate-500">Sin renglones.</div>}
        </div>
      </div>

      {draft.id && onUse ? (
        <button
          className="glass-btn neon"
          onClick={() => onUse({ id: draft.id!, name: draft.name })}
        >
          Usar esta plantilla
        </button>
      ) : null}
    </div>
  );
}

type ReferralEditorFormProps = {
  draft: ReferralDraft;
  onChange: (_updater: (_draft: Draft) => Draft) => void;
  onUse?: TemplateLibraryModalProps["onUse"];
};

function ReferralEditorForm({ draft, onChange, onUse }: ReferralEditorFormProps) {
  const update = (mutator: (_draft: ReferralDraft) => ReferralDraft) => {
    onChange((current) => {
      if (current.type !== "referral") return current;
      return mutator(current);
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Nombre</span>
          <input
            className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
            value={draft.name}
            onChange={(e) => update((cur) => ({ ...cur, name: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Especialidad</span>
          <input
            className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
            value={draft.metaSpecialty}
            onChange={(e) => update((cur) => ({ ...cur, metaSpecialty: e.target.value }))}
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Descripción breve</span>
          <input
            className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
            value={draft.metaSummary}
            onChange={(e) => update((cur) => ({ ...cur, metaSummary: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Dirigido a especialidad</span>
          <input
            className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
            value={draft.to_specialty}
            onChange={(e) => update((cur) => ({ ...cur, to_specialty: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Nombre del profesional</span>
          <input
            className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
            value={draft.to_doctor_name}
            onChange={(e) => update((cur) => ({ ...cur, to_doctor_name: e.target.value }))}
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Motivo</span>
          <textarea
            className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
            rows={2}
            value={draft.reason}
            onChange={(e) => update((cur) => ({ ...cur, reason: e.target.value }))}
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Resumen clínico</span>
          <textarea
            className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
            rows={3}
            value={draft.summary}
            onChange={(e) => update((cur) => ({ ...cur, summary: e.target.value }))}
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Plan sugerido</span>
          <textarea
            className="rounded-xl border border-white/30 bg-white/80 px-3 py-2"
            rows={3}
            value={draft.plan}
            onChange={(e) => update((cur) => ({ ...cur, plan: e.target.value }))}
          />
        </label>
      </div>

      {draft.id && onUse ? (
        <button className="glass-btn neon" onClick={() => onUse({ id: draft.id!, name: draft.name })}>
          Usar esta plantilla
        </button>
      ) : null}
    </div>
  );
}

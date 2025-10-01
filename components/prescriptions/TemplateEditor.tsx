"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAutosave } from "@/hooks/useAutosave";

export type RxTemplate = {
  id?: string;
  org_id?: string | null;
  specialty: string;
  title: string;
  body: string;
  notes?: string | null;
  is_reference?: boolean | null;
};

type Props = {
  initial: RxTemplate;
  onSaved?: (_tpl: RxTemplate) => void;
};

type UpsertResponse = {
  ok?: boolean;
  data?: { id?: string } | null;
  id?: string;
  error?: { message?: string };
};

async function upsertTemplate(tpl: RxTemplate) {
  const res = await fetch("/api/prescriptions/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tpl),
  });
  const json = (await res.json().catch(() => null)) as UpsertResponse | null;
  if (!res.ok || json?.ok === false) {
    const message = json?.error?.message || "No se pudo guardar";
    throw new Error(message);
  }
  const id = json?.data?.id ?? json?.id ?? tpl.id;
  const next: RxTemplate = { ...tpl, id };
  return next;
}

export default function TemplateEditor({ initial, onSaved }: Props) {
  const saveFn = useCallback(
    async (draft: RxTemplate) => {
      const saved = await upsertTemplate({
        ...draft,
        notes: draft.notes?.trim() ? draft.notes : null,
      });
      onSaved?.(saved);
      return saved;
    },
    [onSaved],
  );

  const { data, setData, status, flush } = useAutosave(initial, saveFn);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {status === "saving" && "Guardando…"}
          {status === "saved" && "Guardado ✓"}
          {status === "error" && "Error al guardar"}
          {status === "idle" && "Los cambios se guardarán automáticamente"}
        </div>
        <Button type="button" variant="secondary" onClick={() => void flush()}>
          Guardar ahora
        </Button>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-1">
          <label className="text-sm text-contrast/80">Especialidad</label>
          <input
            className="input"
            value={data.specialty}
            onChange={(e) => setData({ ...data, specialty: e.target.value })}
            placeholder="Ej. Medicina familiar, Cardiología, Odontología…"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-contrast/80">Título</label>
          <input
            className="input"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="Ej. Amoxicilina 500 mg c/8h x7d"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-contrast/80">Contenido</label>
          <textarea
            className="input min-h-44"
            value={data.body}
            onChange={(e) => setData({ ...data, body: e.target.value })}
            placeholder="Medicamento, dosis, vía, frecuencia, duración o cuerpo de la referencia"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-contrast/80">Notas / Advertencias</label>
          <textarea
            className="input min-h-24"
            value={data.notes ?? ""}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            placeholder="Alergias, precauciones, seguimiento…"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(data.is_reference)}
            onChange={(e) => setData({ ...data, is_reference: e.target.checked })}
          />
          Es referencia (no receta)
        </label>
      </div>
    </div>
  );
}

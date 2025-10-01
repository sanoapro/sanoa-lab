"use client";
import { useCallback } from "react";
import Emoji from "@/components/Emoji";
import { Button } from "@/components/ui/button";
import GlassModal from "@/components/ui/GlassModal";
import { useAutosave } from "@/hooks/useAutosave";
import type { RxTemplate } from "./TemplateEditor";

export type { RxTemplate } from "./TemplateEditor";

type Props = {
  open: boolean;
  onClose: () => void;
  initial: RxTemplate;
  onSaved?: (_tpl: RxTemplate) => void;
};

type UpsertResponse = { ok?: boolean; data?: { id?: string } | null; id?: string; error?: { message?: string } };

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

export default function TemplateEditorModal({ open, onClose, initial, onSaved }: Props) {
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
    <GlassModal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Emoji size="lg">🧪</Emoji> Editar plantilla
        </div>
      }
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {status === "saving" && "Guardando…"}
            {status === "saved" && "Guardado ✓"}
            {status === "error" && "Error al guardar"}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => void flush()}>
              💾 Guardar ahora
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      }
      size="lg"
    >
      <div className="grid gap-3">
        <label className="text-sm text-contrast/80">Especialidad</label>
        <input
          className="input"
          value={data.specialty}
          onChange={(e) => setData({ ...data, specialty: e.target.value })}
          placeholder="Ej. Medicina Familiar, Cardiología, Odontología…"
        />
        <label className="text-sm text-contrast/80">Título</label>
        <input
          className="input"
          value={data.title}
          onChange={(e) => setData({ ...data, title: e.target.value })}
          placeholder="Ej. Amoxicilina 500 mg c/8h x7d"
        />
        <label className="text-sm text-contrast/80">Contenido (receta / referencia)</label>
        <textarea
          className="input min-h-44"
          value={data.body}
          onChange={(e) => setData({ ...data, body: e.target.value })}
          placeholder="Formato libre: medicamento, dosis, vía, frecuencia, duración. O cuerpo de la carta de referencia."
        />
        <label className="text-sm text-contrast/80">Notas/Advertencias</label>
        <textarea
          className="input min-h-20"
          value={data.notes ?? ""}
          onChange={(e) => setData({ ...data, notes: e.target.value })}
          placeholder="Alergias, interacciones, precauciones, seguimiento…"
        />
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(data.is_reference)}
            onChange={(e) => setData({ ...data, is_reference: e.target.checked })}
          />
          <span className="text-sm">Es referencia (no receta)</span>
        </label>
      </div>
    </GlassModal>
  );
}

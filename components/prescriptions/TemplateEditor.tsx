"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAutosave } from "@/hooks/useAutosave";

/** ===== Tipos ===== */
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

/** ===== Persistencia en servidor ===== */
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

/** ===== Editor ===== */
export default function TemplateEditor({ initial, onSaved }: Props) {
  /** Guardado en servidor (autosave) */
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

  /** ===== Borrador local (localStorage) ===== */
  const storageKey = useMemo(
    () => `rx-template:draft:${data.id ?? "new"}`,
    [data.id],
  );
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carga el borrador local si existe (solo una vez al montar)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const v = JSON.parse(cached) as Partial<RxTemplate>;
        setData({ ...data, ...v });
      }
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intencionalmente sólo al montar

  // Guarda borrador local con debounce cuando cambia el draft
  useEffect(() => {
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        /* noop */
      }
    }, 500);
    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
  }, [data, storageKey]);

  function discardLocalDraft() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* noop */
    }
    // Volver al estado inicial del componente (lo más predecible)
    setData(initial);
  }

  /** ===== UI ===== */
  return (
    <div className="space-y-4">
      {/* Barra de estado + acciones rápidas */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {status === "saving" && "Guardando…"}
          {status === "saved" && "Guardado ✓"}
          {status === "error" && "Error al guardar"}
          {status === "idle" && "Los cambios se guardarán automáticamente"}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={discardLocalDraft}>
            Descartar borrador
          </Button>
          <Button type="button" variant="secondary" onClick={() => void flush()}>
            Guardar ahora
          </Button>
        </div>
      </div>

      {/* Campos */}
      <div className="grid gap-3">
        <div className="grid gap-1">
          <label className="text-sm text-contrast/80">Especialidad</label>
          {/* Select con opciones comunes (puedes ajustar/añadir libremente) */}
          <select
            className="input h-11"
            value={data.specialty}
            onChange={(e) => setData({ ...data, specialty: e.target.value })}
          >
            <option value="">— Selecciona —</option>
            <option value="mente">Mente</option>
            <option value="pulso">Pulso</option>
            <option value="equilibrio">Equilibrio</option>
            <option value="sonrisa">Sonrisa</option>
            <option value="general">General</option>
          </select>
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

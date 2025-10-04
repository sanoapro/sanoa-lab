// components/prescriptions/TemplateEditor.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Field, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";

// ✅ Exporta el tipo para que TemplateEditorModal pueda importarlo
export type RxTemplate = {
  id?: string;
  specialty: string;
  title: string;
  body: string;
  notes?: string | null;       // opcional (lo usa el modal)
  is_reference?: boolean;      // opcional (lo usa el modal)
};

export default function TemplateEditor({
  initial,
  onSaved,
}: {
  initial?: Partial<RxTemplate>;
  onSaved?: (tpl: RxTemplate) => void;
}) {
  const { toast } = useToast();
  const [tpl, setTpl] = useState<RxTemplate>({
    id: initial?.id,
    specialty: initial?.specialty ?? "general",
    title: initial?.title ?? "",
    body: initial?.body ?? "",
    notes: initial?.notes ?? null,
    is_reference: initial?.is_reference ?? false,
  });
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storageKey = useMemo(() => `rx-template:draft:${tpl.id ?? "new"}`, [tpl.id]);

  // Carga borrador si existe
  useEffect(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const v = JSON.parse(cached);
        setTpl((t: any) => ({ ...t, ...v }));
      }
    } catch {}
     
  }, [storageKey]);

  // Autosave local + POST (debounced)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(tpl));
      } catch {}
      try {
        setSaving("saving");
        const res = await fetch("/api/prescriptions/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item: tpl }),
        });
        if (!res.ok) throw new Error();
        const saved = (await res.json()) as { item: RxTemplate };
        setTpl(saved.item);
        setSaving("saved");
        onSaved?.(saved.item);
      } catch {
        // No rompas el flujo si el endpoint no existe todavía.
        setSaving("error");
      }
    }, 800); // debounce

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [tpl.specialty, tpl.title, tpl.body]);  

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {saving === "saving" && "Guardando…"}
          {saving === "saved" && "Guardado ✓"}
          {saving === "error" && "Guardado local (sin servidor)"}
        </span>
      </div>

      <Field label="Especialidad" hint="Selecciona la especialidad">
        <select
          className="h-11 rounded-lg border border-border bg-background px-3"
          value={tpl.specialty}
          onChange={(e: any) => setTpl((t: any) => ({ ...t, specialty: e.target.value }))}
        >
          <option value="mente">Mente</option>
          <option value="pulso">Pulso</option>
          <option value="equilibrio">Equilibrio</option>
          <option value="sonrisa">Sonrisa</option>
          <option value="general">General</option>
        </select>
      </Field>

      <Field label="Título" required>
        <Input
          value={tpl.title}
          onChange={(e: any) => setTpl((t: any) => ({ ...t, title: e.target.value }))}
          placeholder="Ej. Sertralina 50 mg cada 24h"
        />
      </Field>

      <Field label="Contenido" hint="Indicaciones, dosis, duración, advertencias" required>
        <Textarea
          value={tpl.body}
          onChange={(e: any) => setTpl((t: any) => ({ ...t, body: e.target.value }))}
          rows={10}
          placeholder="Escribe la plantilla de la receta…"
        />
      </Field>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            try {
              localStorage.removeItem(storageKey);
              toast({ title: "Borrador descartado" });
            } catch {}
          }}
        >
          Descartar borrador
        </Button>
        <Button
          onClick={() => {
            toast({ title: "Guardado manual", description: "Se intentó guardar en el servidor." });
          }}
        >
          Guardar ahora
        </Button>
      </div>
    </div>
  );
}

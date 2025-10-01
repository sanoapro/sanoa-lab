// components/prescriptions/TemplatePicker.tsx
"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import TemplateEditor, { type RxTemplate } from "./TemplateEditor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import seeds from "@/lib/prescriptions/templates.seed";

type Props = {
  onSelect?: (_tpl: RxTemplate) => void;
};

type ApiTemplate = Partial<RxTemplate> & {
  id?: string;
  org_id?: string | null;
  name?: string;
  body?: string;
  title?: string;
  specialty?: string | null;
  notes?: string | null;
  content?: unknown;
  is_reference?: boolean | null;
};

const FALLBACK_SEEDS: RxTemplate[] = seeds.map((tpl) => ({
  id: undefined,
  org_id: null,
  specialty: tpl.specialty,
  title: tpl.title,
  body: tpl.body,
  notes: null,
  is_reference: null,
}));

function normalizeTemplate(raw: ApiTemplate): RxTemplate {
  const content = (raw.content ?? {}) as Record<string, unknown>;
  const specialty = (raw.specialty ?? content.specialty ?? "general") as string;
  const title = (raw.title ?? raw.name ?? (content.title as string) ?? "") as string;
  const body = (raw.body ?? (content.body as string) ?? "") as string;
  const notes = (raw.notes ?? (content.notes as string | null) ?? null) || null;
  const isReference =
    (raw.is_reference ?? (content.is_reference as boolean | null) ?? null) ?? null;

  return {
    id: raw.id,
    org_id: raw.org_id ?? (content.org_id as string | null) ?? null,
    specialty,
    title,
    body,
    notes,
    is_reference: isReference,
  };
}

export default function TemplatePicker({ onSelect }: Props) {
  const [items, setItems] = useState<RxTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<RxTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/prescriptions/templates", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; items?: ApiTemplate[]; data?: ApiTemplate[] }
          | ApiTemplate[]
          | null;

        if (!res.ok) {
          throw new Error(json && typeof json === "object" ? JSON.stringify(json) : "Error remoto");
        }

        const list: ApiTemplate[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.items)
          ? (json?.items as ApiTemplate[])
          : Array.isArray(json?.data)
          ? (json?.data as ApiTemplate[])
          : [];

        const normalized = list.map((item) => normalizeTemplate(item));
        if (!active) return;

        if (normalized.length) {
          setItems(normalized);
          setUsedFallback(false);
        } else {
          setItems(FALLBACK_SEEDS);
          setUsedFallback(true);
        }
      } catch (err) {
        console.error(err);
        if (!active) return;
        setItems(FALLBACK_SEEDS);
        setUsedFallback(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {usedFallback ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          No se pudo cargar la biblioteca remota. Mostrando base local.
        </div>
      ) : null}

      {loading && !items.length ? (
        <p className="text-sm text-muted-foreground">Cargando plantillas…</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <Card key={`${it.id ?? "seed"}-${i}`} className="card-hover">
            <CardHeader>
              <CardTitle>{it.title || "Sin título"}</CardTitle>
              <CardDescription className="capitalize">
                {it.specialty || "General"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="text-sm whitespace-pre-wrap text-muted-foreground">{it.body}</pre>
              {it.notes ? (
                <p className="text-sm text-muted-foreground">⚠️ {it.notes}</p>
              ) : null}
              <div className="flex justify-end gap-2">
                {onSelect ? (
                  <Button
                    variant="primary"
                    onClick={() => onSelect(it)}
                    disabled={!it.id}
                  >
                    Usar
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrent({ ...it });
                    setOpen(true);
                  }}
                >
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && !items.length ? (
        <p className="mt-4 text-sm text-muted-foreground">Sin plantillas disponibles.</p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button
          onClick={() => {
            setCurrent({
              id: undefined,
              org_id: null,
              specialty: "general",
              title: "",
              body: "",
              notes: "",
              is_reference: false,
            });
            setOpen(true);
          }}
        >
          Nueva plantilla
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setCurrent(null);
        }}
        title={current?.id ? "Editar plantilla" : "Nueva plantilla"}
        widthClass="max-w-3xl"
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setOpen(false);
              setCurrent(null);
            }}
          >
            Listo
          </Button>
        }
      >
        {current ? (
          <TemplateEditor
            initial={current}
            onSaved={(saved) => {
              setItems((prev) => {
                const idx = prev.findIndex((item) => item.id && saved.id && item.id === saved.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = saved;
                  return copy;
                }
                return [saved, ...prev];
              });
              setCurrent(saved);
              setUsedFallback(false);
            }}
          />
        ) : null}
      </Modal>
    </>
  );
}

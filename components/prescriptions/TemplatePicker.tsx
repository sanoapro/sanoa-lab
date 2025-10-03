// components/prescriptions/TemplatePicker.tsx
"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import TemplateEditor from "./TemplateEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import seeds from "@/lib/prescriptions/templates.seed";

type RxTpl = { id?: string; specialty: string; title: string; body: string };

export default function TemplatePicker() {
  const [items, setItems] = useState<RxTpl[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<RxTpl | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/prescriptions/templates");
        if (!r.ok) throw new Error();
        const data = await r.json();
        const list: RxTpl[] = data.items ?? [];
        setItems(list.length ? list : seeds);
      } catch {
        setItems(seeds);
      }
    })();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it: any, i: any) => (
          <Card key={`${it.id ?? "seed"}-${i}`} className="card-hover">
            <CardHeader>
              <CardTitle className="text-base font-bold">{it.title}</CardTitle>
              <CardDescription className="capitalize">{it.specialty}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="text-sm whitespace-pre-wrap text-muted-foreground">{it.body}</pre>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrent(it);
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

      <div className="mt-4 flex justify-end">
        <Button
          onClick={() => {
            setCurrent({ specialty: "general", title: "", body: "" });
            setOpen(true);
          }}
        >
          Nueva plantilla
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={current?.id ? "Editar plantilla" : "Nueva plantilla"}
        size="xl"
        footer={<Button variant="primary" onClick={() => setOpen(false)}>Listo</Button>}
      >
        {current && (
          <TemplateEditor
            initial={current}
            onSaved={(saved: any) => {
              setItems((prev: any) => {
                const has = prev.findIndex((p: any) => p.id === saved.id && saved.id);
                if (has >= 0) {
                  const nxt = [...prev];
                  nxt[has] = saved;
                  return nxt;
                }
                return [saved, ...prev];
              });
            }}
          />
        )}
      </Modal>
    </>
  );
}

// components/patients/PatientAutocomplete.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Item = { id: string; name: string; doc?: string };

type Selection = {
  id: string;
  label: string;
  name?: string;
  doc?: string;
};

export default function PatientAutocomplete({
  onSelect,
  placeholder = "Buscar paciente",
  orgId,
  scope,
  className,
}: {
  onSelect?: (p: Selection | null) => void;
  orgId?: string;
  scope?: string;
  placeholder?: string;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q) { setItems([]); setOpen(false); return; }
      setLoading(true);
      try {
        const url = new URL("/api/patients/suggest", window.location.origin);
        url.searchParams.set("q", q.trim());
        if (orgId) url.searchParams.set("org_id", orgId);
        if (scope) url.searchParams.set("scope", scope);
        const r = await fetch(url.toString(), { cache: "no-store" });
        const data = await r.json();
        setItems((data?.items ?? []).slice(0, 8));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
        setOpen(true);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, orgId, scope]);

  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <input
        className={cn(
          "w-full h-11 rounded-lg border border-border bg-background px-3 text-base",
          "focus:outline-none focus:ring-2 focus:ring-primary/60",
          "relative z-[1] pointer-events-auto"
        )}
        placeholder={placeholder}
        value={q}
        onChange={(e: any) => setQ(e.target.value)}
        onFocus={() => q && setOpen(true)}
      />
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-border bg-card text-card-foreground shadow-elevated overflow-hidden z-50"
          role="listbox"
        >
          {loading && <div className="px-3 py-2 text-sm">Buscando…</div>}
          {!loading && items.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
          )}
          {!loading &&
            items.map((it: any) => (
              <button
                key={it.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                onClick={() => {
                  onSelect?.({ ...it, label: it.name });
                  setQ(it.name);
                  setOpen(false);
                }}
                role="option"
              >
                <div className="font-medium">{it.name}</div>
                {it.doc && <div className="text-xs text-muted-foreground">{it.doc}</div>}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// components/patients/PatientAutocomplete.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
  id: string;
  name: string | null;
  dob?: string | null;
  gender?: string | null;
};

type Props = {
  orgId: string;
  /** Opcional: ámbito de búsqueda. Si tu endpoint de autocomplete lo usa, acepta "mine" | "org". */
  scope?: string;
  placeholder?: string;
  onSelect: (value: { id: string; label: string }) => void;
};

export default function PatientAutocomplete({
  orgId,
  scope,
  placeholder = "Buscar paciente…",
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  // Cierra al hacer click fuera
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Búsqueda con debounce (min 2 chars)
  useEffect(() => {
    // limpiar timers y aborts anteriores
    if (timer.current) clearTimeout(timer.current);
    ctrlRef.current?.abort();

    if (!orgId) {
      setItems([]);
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setItems([]);
      return;
    }

    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        // 1) Intentar endpoint liviano de autocomplete
        const p = new URLSearchParams({ org_id: orgId, q });
        if (scope) p.set("scope", scope);
        const r1 = await fetch(`/api/patients/autocomplete?${p.toString()}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });

        if (r1.ok) {
          const j = await r1.json();
          const arr: { id: string; label: string }[] = j?.ok ? j.data ?? [] : [];
          setItems(arr);
          setOpen(true);
          return;
        }

        // 2) Fallback a /search (mapea a {id,label})
        const p2 = new URLSearchParams({ org_id: orgId, q, pageSize: "10" });
        if (scope) p2.set("scope", scope);
        const r2 = await fetch(`/api/patients/search?${p2.toString()}`, {
          signal: ctrl.signal,
        });
        const j2 = await r2.json();
        const rows: Option[] = j2?.ok ? j2.data ?? [] : [];
        const mapped = rows.map((r) => {
          const base = r.name ? String(r.name) : "Paciente sin nombre";
          const extra = [r.gender, r.dob ? new Date(r.dob).toLocaleDateString() : null]
            .filter(Boolean)
            .join(" · ");
          return { id: r.id, label: extra ? `${base} — ${extra}` : base };
        });
        setItems(mapped);
        setOpen(true);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("PatientAutocomplete", err);
          setItems([]);
          setOpen(false);
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      ctrl.abort();
    };
  }, [orgId, query, scope]);

  const hasResults = items.length > 0;
  const helpText = useMemo(() => {
    if (!orgId) return "Selecciona una organización";
    if (query.trim().length < 2) return "Escribe al menos 2 caracteres";
    if (loading) return "Buscando…";
    if (!hasResults) return "Sin coincidencias";
    return "";
  }, [orgId, query, loading, hasResults]);

  return (
    <div className="space-y-1 relative" ref={boxRef}>
      <input
        aria-autocomplete="list"
        aria-expanded={open}
        className="border rounded px-3 py-2 w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={!orgId}
        onFocus={() => query.trim().length >= 2 && hasResults && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        autoComplete="off"
      />

      {helpText && <p className="text-xs text-slate-500">{helpText}</p>}

      {open && hasResults && (
        <ul
          role="listbox"
          className="absolute z-10 bg-white border rounded mt-1 max-h-64 overflow-auto w-full shadow divide-y"
        >
          {items.map((it) => (
            <li key={it.id} role="option">
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-50 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault(); // evita blur antes del click
                  onSelect(it);
                  setQuery(it.label);
                  setOpen(false);
                }}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !hasResults && !loading && (
        <div className="absolute z-10 bg-white border rounded mt-1 w-full px-3 py-2 text-sm text-slate-500">
          Sin resultados
        </div>
      )}
    </div>
  );
}

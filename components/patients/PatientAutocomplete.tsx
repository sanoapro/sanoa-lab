// components/patients/PatientAutocomplete.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type OptionRaw = {
  id: string;
  name?: string | null;
  title?: string | null;
  label?: string | null;
  text?: string | null;
  dob?: string | null;
  gender?: string | null;
  patient_id?: string | null;
  value?: string | null;
};

export type PatientOption = { id: string; label: string };

type Props = {
  orgId: string;
  /** Ámbito de búsqueda. Acepta "mine" | "org" u otros valores si el backend los soporta. */
  scope?: string;
  placeholder?: string;
  onSelect?: (option: PatientOption | null) => void;
};

export default function PatientAutocomplete({
  orgId,
  scope = "mine",
  placeholder = "Buscar paciente…",
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  // Cerrar el desplegable al hacer click fuera
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Debounce de búsqueda (mínimo 2 caracteres) con múltiples fallbacks
  useEffect(() => {
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
        // 1) Endpoint autocomplete (rápido)
        const p1 = new URLSearchParams({ org_id: orgId, q });
        if (scope) p1.set("scope", String(scope));
        const r1 = await fetch(`/api/patients/autocomplete?${p1.toString()}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });

        if (r1.ok) {
          const j1 = await r1.json();
          const arr: PatientOption[] = j1?.ok
            ? (j1.data ?? []).map((x: any) => ({
                id: String(x.id),
                label: String(x.label ?? x.name ?? x.title ?? x.text ?? "Paciente"),
              }))
            : [];
          setItems(arr);
          setOpen(true);
          return;
        }

        // 2) Fallback a /patients/search
        const p2 = new URLSearchParams({ org_id: orgId, q, pageSize: "10" });
        if (scope) p2.set("scope", String(scope));
        const r2 = await fetch(`/api/patients/search?${p2.toString()}`, { signal: ctrl.signal });
        if (r2.ok) {
          const j2 = await r2.json();
          const rows: OptionRaw[] = j2?.ok ? (j2.data ?? []) : [];
          const mapped: PatientOption[] = rows.map((r) => {
            const base = r.label ?? r.name ?? r.title ?? r.text ?? "Paciente sin nombre";
            const extra = [r.gender, r.dob ? new Date(r.dob).toLocaleDateString() : null]
              .filter(Boolean)
              .join(" · ");
            return {
              id: String(r.id ?? r.patient_id ?? r.value ?? base),
              label: extra ? `${base} — ${extra}` : String(base),
            };
          });
          setItems(mapped);
          setOpen(true);
          return;
        }

        // 3) Fallback a buscador genérico
        const p3 = new URLSearchParams({
          scope: "patients",
          org_id: orgId,
          q,
          mine: scope === "mine" ? "1" : "0",
          limit: "10",
        });
        const r3 = await fetch(`/api/search/query?${p3.toString()}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (r3.ok) {
          const j3 = await r3.json();
          const arr: PatientOption[] = Array.isArray(j3?.data)
            ? j3.data.map((x: any) => ({
                id: String(x.id || x.patient_id || x.value || x.uid || q),
                label: String(x.label || x.name || x.title || x.text || "Paciente"),
              }))
            : [];
          setItems(arr.slice(0, 10));
          setOpen(true);
          return;
        }

        // Si todo falla
        setItems([]);
        setOpen(false);
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
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(false);
          if (!e.target.value.trim()) onSelect?.(null);
        }}
        disabled={!orgId}
        onFocus={() => query.trim().length >= 2 && hasResults && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
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
                  e.preventDefault(); // evita blur antes de click
                  onSelect?.(it);
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

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
  scope?: string;
  placeholder?: string;
  onSelect: (value: { id: string; label: string }) => void;
};

export default function PatientAutocomplete({ orgId, scope, placeholder, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!orgId) {
      setResults([]);
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ org_id: orgId, q: trimmed, pageSize: "10" });
      if (scope) params.set("scope", scope);
      setLoading(true);
      fetch(`/api/patients/search?${params.toString()}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((j) => {
          if (!ctrl.signal.aborted) {
            setResults(j?.ok ? j.data ?? [] : []);
            setOpen(true);
          }
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            console.error("PatientAutocomplete", err);
          }
        })
        .finally(() => !ctrl.signal.aborted && setLoading(false));
    }, 250);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [orgId, query, scope]);

  const hasResults = results.length > 0;

  const helpText = useMemo(() => {
    if (!orgId) return "Selecciona una organización";
    if (query.trim().length < 2) return "Escribe al menos 2 caracteres";
    if (loading) return "Buscando…";
    if (!hasResults) return "Sin coincidencias";
    return "";
  }, [orgId, query, loading, hasResults]);

  return (
    <div className="space-y-1" ref={boxRef}>
      <input
        className="border rounded px-3 py-2 w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder ?? "Buscar paciente"}
        disabled={!orgId}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        autoComplete="off"
      />
      {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
      {open && hasResults && (
        <ul className="border rounded-lg bg-white shadow divide-y max-h-64 overflow-auto">
          {results.map((r) => {
            const label = r.name ? String(r.name) : "Paciente sin nombre";
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-slate-100"
                  onClick={() => {
                    onSelect({ id: r.id, label });
                    setQuery(label);
                    setOpen(false);
                  }}
                >
                  <div className="font-medium">{label}</div>
                  {(r.gender || r.dob) && (
                    <div className="text-xs text-slate-500">
                      {[r.gender, r.dob ? new Date(r.dob).toLocaleDateString() : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

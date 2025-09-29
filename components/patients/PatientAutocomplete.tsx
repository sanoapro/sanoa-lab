"use client";
import { useEffect, useMemo, useState } from "react";

type PatientOption = { id: string; label: string };

type Props = {
  orgId: string;
  scope?: string;
  placeholder?: string;
  onSelect?: (option: PatientOption | null) => void;
};

export default function PatientAutocomplete({ orgId, scope, placeholder, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSearch = useMemo(() => query.trim().length >= 2, [query]);

  useEffect(() => {
    if (!canSearch || !orgId) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ org_id: orgId, q: query.trim(), page: "1", pageSize: "8" });
    if (scope) params.set("scope", scope);
    fetch(`/api/patients/search?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok) return;
        const opts = (j.data ?? []).map((row: any) => ({
          id: row.id,
          label: row.name || row.full_name || row.display_name || row.id,
        }));
        setResults(opts);
        setOpen(true);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [canSearch, orgId, query, scope]);

  function select(option: PatientOption) {
    setQuery(option.label);
    setOpen(false);
    onSelect?.(option);
  }

  return (
    <div className="relative">
      <input
        className="border rounded px-3 py-2 w-full"
        placeholder={placeholder ?? "Buscar paciente…"}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(false);
          if (!e.target.value.trim()) onSelect?.(null);
        }}
        onFocus={() => canSearch && setOpen(true)}
      />
      {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Cargando…</div>}
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded border bg-white shadow">
          <ul className="max-h-64 overflow-auto text-sm">
            {results.map((opt) => (
              <li
                key={opt.id}
                className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(opt)}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {open && !loading && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded border bg-white shadow text-sm px-3 py-2 text-slate-500">
          Sin resultados
        </div>
      )}
    </div>
  );
}

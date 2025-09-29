"use client";
import { useEffect, useMemo, useState } from "react";

type Option = { id: string; label: string };

type Props = {
  orgId: string;
  scope?: "mine" | "all";
  placeholder?: string;
  onSelect?: (value: Option | null) => void;
};

export default function PatientAutocomplete({ orgId, scope, placeholder, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId || !query.trim()) {
      setOptions([]);
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ org_id: orgId, q: query.trim(), pageSize: "6" });
    if (scope && scope !== "all") params.set("scope", scope);
    fetch(`/api/patients/search?${params.toString()}`)
      .then(res => res.json())
      .then((j) => {
        if (!alive) return;
        if (j?.ok) {
          setOptions((j.data || []).map((r: any) => ({ id: r.id, label: r.name || r.curp || r.id })));
        } else {
          setError(j?.error?.message || "Error al cargar pacientes");
          setOptions([]);
        }
      })
      .catch(() => alive && setError("Error al cargar pacientes"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [orgId, query, scope]);

  const hint = useMemo(() => {
    if (!orgId) return "Selecciona una organización";
    if (!query.trim()) return "Ingresa al menos 1 carácter";
    if (loading) return "Buscando…";
    if (error) return error;
    if (!options.length) return "Sin resultados";
    return null;
  }, [orgId, query, loading, error, options]);

  return (
    <div className="space-y-2">
      <input
        className="border rounded px-3 py-2 w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || "Buscar paciente"}
        inputMode="text"
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {!hint && (
        <ul className="border rounded-xl divide-y max-h-60 overflow-auto">
          {options.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-slate-100"
                onClick={() => onSelect?.(opt)}
              >
                <div className="text-sm font-medium">{opt.label || "Sin nombre"}</div>
                <div className="text-xs text-slate-500">{opt.id}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

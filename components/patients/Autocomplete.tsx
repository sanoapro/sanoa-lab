"use client";

import * as React from "react";

type Hit = {
  patient_id: string;
  name: string;
  gender?: string | null;
  age?: number | null;
  extra?: string | null;
};

export default function Autocomplete({
  placeholder = "Busca paciente…",
  onSelect,
}: {
  placeholder?: string;
  onSelect: (hit: Hit) => void;
}) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [hits, setHits] = React.useState<Hit[]>([]);
  const [index, setIndex] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Cerrar al click fuera
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Buscar con debounce
  React.useEffect(() => {
    if (!q || q.trim().length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `/api/patients/search?q=${encodeURIComponent(q)}&limit=8`;
        const r = await fetch(url, { cache: "no-store" });
        const j = await r.json();
        if (j?.ok && Array.isArray(j.data)) {
          const mapped: Hit[] = j.data
            .map((row: any) => ({
              patient_id: row.patient_id ?? row.id ?? row.patientId ?? row.p_id,
              name: row.name ?? row.full_name ?? row.display ?? "Paciente",
              gender: row.gender ?? row.genero ?? null,
              age: row.age ?? row.edad ?? null,
              extra: row.extra ?? null,
            }))
            .filter((h: Hit) => !!h.patient_id && !!h.name);
          setHits(mapped);
          setIndex(0);
          setOpen(mapped.length > 0);
        } else {
          setHits([]);
          setOpen(false);
        }
      } catch {
        setHits([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(id);
  }, [q]);

  function commit(i: number) {
    const h = hits[i];
    if (!h) return;
    onSelect(h);
    setOpen(false);
    setQ("");
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(hits.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(index);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900"
        aria-expanded={open}
        aria-controls="patient-autocomplete-listbox"
        aria-autocomplete="list"
        role="combobox"
      />
      {open && (
        <ul
          id="patient-autocomplete-listbox"
          role="listbox"
          className="absolute z-40 mt-1 w-full rounded-xl border bg-white dark:bg-slate-900 shadow"
        >
          {hits.map((h, i) => (
            <li
              key={h.patient_id}
              role="option"
              aria-selected={i === index}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(i);
              }}
              onMouseEnter={() => setIndex(i)}
              className={[
                "px-3 py-2 cursor-pointer",
                i === index ? "bg-slate-100 dark:bg-slate-800" : "",
              ].join(" ")}
            >
              <div className="font-medium">{h.name}</div>
              <div className="text-xs text-slate-500">
                {h.gender ? `${h.gender} · ` : ""}
                {typeof h.age === "number" ? `${h.age} años · ` : ""}
                {h.extra ?? "Paciente"}
              </div>
            </li>
          ))}
          {loading && <li className="px-3 py-2 text-sm text-slate-500">Buscando…</li>}
        </ul>
      )}
    </div>
  );
}

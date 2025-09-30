// components/patients/Autocomplete.tsx
"use client";

import * as React from "react";
import { getActiveOrg } from "@/lib/org-local";

type Hit = {
  patient_id: string;
  name: string;
  gender?: string | null;
  age?: number | null;
  extra?: string | null;
};

type Props = {
  placeholder?: string;
  onSelect: (hit: Hit) => void;
  /** Limita búsqueda a pacientes atendidos por el usuario actual (si el backend lo soporta). */
  onlyMine?: boolean;
  limit?: number;
  autoFocus?: boolean;
};

export default function Autocomplete({
  placeholder = "Busca paciente…",
  onSelect,
  onlyMine = true,
  limit = 10,
  autoFocus = false,
}: Props) {
  const org = getActiveOrg();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [hits, setHits] = React.useState<Hit[]>([]);
  const [index, setIndex] = React.useState(-1);

  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const debounceRef = React.useRef<number | null>(null);

  // Cerrar al click fuera
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Buscar con debounce (intenta /suggest y hace fallback a /search)
  React.useEffect(() => {
    if (!q || q.trim().length < 2 || !org?.id) {
      setHits([]);
      setOpen(false);
      setIndex(-1);
      return;
    }

    setLoading(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        // 1) Primer intento: endpoint de sugerencias (más barato)
        const url = new URL("/api/patients/suggest", window.location.origin);
        url.searchParams.set("q", q.trim());
        url.searchParams.set("org_id", org.id!);
        url.searchParams.set("only_mine", onlyMine ? "true" : "false");
        url.searchParams.set("limit", String(limit));
        let r = await fetch(url.toString(), { cache: "no-store" });
        let j: any = null;
        try { j = await r.json(); } catch { j = null; }

        let rows: any[] = [];
        if (j?.ok && Array.isArray(j.data)) {
          rows = j.data;
        } else {
          // 2) Fallback: endpoint de búsqueda “clásico”
          const url2 = new URL("/api/patients/search", window.location.origin);
          url2.searchParams.set("q", q.trim());
          url2.searchParams.set("limit", String(limit));
          r = await fetch(url2.toString(), { cache: "no-store" });
          try { j = await r.json(); } catch { j = null; }
          if (j?.ok && Array.isArray(j.data)) rows = j.data;
          else if (Array.isArray(j?.items)) rows = j.items;
        }

        const mapped: Hit[] = rows
          .map((row: any) => ({
            patient_id:
              row.patient_id ?? row.id ?? row.patientId ?? row.p_id ?? row.uuid,
            name:
              row.display_name ??
              row.name ??
              row.full_name ??
              row.display ??
              "Paciente",
            gender: row.gender ?? row.genero ?? null,
            age: row.age ?? row.edad ?? null,
            extra: row.extra ?? null,
          }))
          .filter((h: Hit) => !!h.patient_id && !!h.name);

        setHits(mapped);
        setOpen(mapped.length > 0);
        setIndex(mapped.length ? 0 : -1);
      } catch {
        setHits([]);
        setOpen(false);
        setIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 160);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q, org?.id, onlyMine, limit]);

  function commit(i: number) {
    const h = hits[i];
    if (!h) return;
    onSelect(h);
    setOpen(false);
    setIndex(-1);
    setQ("");
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(hits.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (index >= 0) commit(index);
    } else if (e.key === "Escape") {
      setOpen(false);
      setIndex(-1);
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-xl border bg-white dark:bg-slate-900 px-3 py-2">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none"
          aria-expanded={open}
          aria-controls="patient-autocomplete-listbox"
          aria-autocomplete="list"
          role="combobox"
          autoFocus={autoFocus}
        />
        {loading && <span className="text-xs text-slate-500">Buscando…</span>}
      </div>

      {open && (
        <ul
          id="patient-autocomplete-listbox"
          role="listbox"
          className="absolute z-50 mt-1 w-full max-w-xl rounded-xl border bg-white dark:bg-slate-900 shadow"
        >
          {hits.map((h, i) => (
            <li
              key={`${h.patient_id}-${i}`}
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
              title={h.name}
            >
              <div className="font-medium">{h.name}</div>
              <div className="text-xs text-slate-500">
                {h.gender ? `${h.gender} · ` : ""}
                {typeof h.age === "number" ? `${h.age} años · ` : ""}
                {h.extra ?? "Paciente"}
              </div>
            </li>
          ))}
          {loading && (
            <li className="px-3 py-2 text-sm text-slate-500">Buscando…</li>
          )}
          {!loading && hits.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-500">Sin resultados</li>
          )}
        </ul>
      )}
    </div>
  );
}

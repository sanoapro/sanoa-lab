// components/patients/Autocomplete.tsx
"use client";

import * as React from "react";
import { getActiveOrg } from "@/lib/org-local";

type Suggest = { patient_id: string; display_name: string };

export default function Autocomplete({
  placeholder = "Buscar paciente…",
  onSelect,
  onlyMine = true,
  limit = 10,
  autoFocus = false,
}: {
  placeholder?: string;
  onSelect?: (s: Suggest) => void;
  onlyMine?: boolean;
  limit?: number;
  autoFocus?: boolean;
}) {
  const org = getActiveOrg();
  const [q, setQ] = React.useState("");
  const [list, setList] = React.useState<Suggest[]>([]);
  const [open, setOpen] = React.useState(false);
  const [idx, setIdx] = React.useState(-1);
  const [loading, setLoading] = React.useState(false);
  const refInp = React.useRef<HTMLInputElement | null>(null);
  const refBox = React.useRef<HTMLUListElement | null>(null);
  const debounceRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!q || q.trim().length < 2 || !org.id) {
      setList([]);
      setOpen(false);
      setIdx(-1);
      return;
    }
    setLoading(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const url = new URL("/api/patients/suggest", window.location.origin);
        url.searchParams.set("q", q.trim());
        url.searchParams.set("org_id", org.id!);
        url.searchParams.set("only_mine", onlyMine ? "true" : "false");
        url.searchParams.set("limit", String(limit));
        const r = await fetch(url.toString(), { cache: "no-store" });
        const j = await r.json();
        if (j?.ok) {
          setList(j.data as Suggest[]);
          setOpen(true);
          setIdx(j.data.length ? 0 : -1);
        } else {
          setList([]);
          setOpen(false);
          setIdx(-1);
        }
      } finally {
        setLoading(false);
      }
    }, 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, org.id, onlyMine, limit]);

  function selectAt(i: number) {
    const s = list[i];
    if (!s) return;
    onSelect?.(s);
    setOpen(false);
    setIdx(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !list.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((v) => Math.min(v + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((v) => Math.max(v - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (idx >= 0) selectAt(idx);
    } else if (e.key === "Escape") {
      setOpen(false);
      setIdx(-1);
    }
  }

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-xl border bg-white dark:bg-slate-900 px-3 py-2">
        <input
          ref={refInp}
          className="w-full bg-transparent outline-none"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => { if (list.length) setOpen(true); }}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="patient-ac-listbox"
          autoFocus={autoFocus}
        />
        {loading && <span className="text-xs text-slate-500">Buscando…</span>}
      </div>

      {open && list.length > 0 && (
        <ul
          id="patient-ac-listbox"
          role="listbox"
          ref={refBox}
          className="absolute z-50 mt-1 w-full max-w-xl rounded-xl border bg-white shadow-lg dark:bg-slate-900"
        >
          {list.map((s, i) => (
            <li
              key={s.patient_id}
              role="option"
              aria-selected={i === idx}
              className={[
                "px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10",
                i === idx ? "bg-slate-50 dark:bg-white/10" : "",
              ].join(" ")}
              onMouseDown={(e) => { e.preventDefault(); selectAt(i); }}
              onMouseEnter={() => setIdx(i)}
              title={s.display_name}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

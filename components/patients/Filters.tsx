"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function PatientsFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  const initial = useMemo(() => Object.fromEntries(search.entries()), [search]);

  const [q, setQ] = useState(initial.q ?? "");
  const [genero, setGenero] = useState(initial.genero ?? "");
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");
  const [tagsAny, setTagsAny] = useState(initial.tagsAny ?? "");
  const [tagsAll, setTagsAll] = useState(initial.tagsAll ?? "");
  const [includeDeleted, setIncludeDeleted] = useState(
    (initial.includeDeleted ?? "false") === "true",
  );

  function apply() {
    const p = new URLSearchParams(initial as any);
    function setOrDel(k: string, v: string) {
      if (v && v.trim()) p.set(k, v.trim());
      else p.delete(k);
    }
    setOrDel("q", q);
    setOrDel("genero", genero);
    setOrDel("from", from);
    setOrDel("to", to);
    setOrDel("tagsAny", tagsAny);
    setOrDel("tagsAll", tagsAll);
    if (includeDeleted) p.set("includeDeleted", "true");
    else p.delete("includeDeleted");
    p.delete("page"); // reset
    router.push(`${pathname}?${p.toString()}`);
  }

  function reset() {
    router.push(pathname);
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Buscar</label>
          <input
            className="rounded border px-3 py-2 w-full"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre o término…"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Género</label>
          <select
            className="rounded border px-3 py-2 w-full"
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
          >
            <option value="">(todos)</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="O">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Desde</label>
          <input
            type="date"
            className="rounded border px-3 py-2 w-full"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Hasta</label>
          <input
            type="date"
            className="rounded border px-3 py-2 w-full"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
            />
            <span className="text-sm">Incluir eliminados</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm mb-1">Tags (cualquiera)</label>
          <input
            className="rounded border px-3 py-2 w-full"
            value={tagsAny}
            onChange={(e) => setTagsAny(e.target.value)}
            placeholder="ej. DM2,HTA"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Tags (todas)</label>
          <input
            className="rounded border px-3 py-2 w-full"
            value={tagsAll}
            onChange={(e) => setTagsAll(e.target.value)}
            placeholder="ej. embarazo,alto_riesgo"
          />
        </div>
        <div className="flex items-end gap-2">
          <button className="rounded px-4 py-2 border" onClick={apply}>
            Aplicar
          </button>
          <button className="rounded px-4 py-2 border" onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

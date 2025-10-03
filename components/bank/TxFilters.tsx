"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";

function useQSPush() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  return useCallback(
    (patch: Record<string, string | undefined>) => {
      const q = new URLSearchParams(search.toString());
      Object.entries(patch).forEach(([k, v]: any) => {
        if (v === undefined || v === "") q.delete(k);
        else q.set(k, v);
      });
      q.set("page", "1");
      router.push(`${pathname}?${q.toString()}`);
    },
    [router, pathname, search],
  );
}

export default function TxFilters() {
  const push = useQSPush();
  const search = useSearchParams();

  const [q, setQ] = useState(search.get("q") ?? "");
  const [from, setFrom] = useState(search.get("from") ?? "");
  const [to, setTo] = useState(search.get("to") ?? "");
  const [status, setStatus] = useState(search.get("status") ?? "");

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Buscar</label>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Descripción (memo)…"
            value={q}
            onChange={(e: any) => setQ(e.target.value)}
            onKeyDown={(e: any) => e.key === "Enter" && push({ q })}
            aria-label="Buscar por descripción"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Desde</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            value={from}
            onChange={(e: any) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hasta</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            value={to}
            onChange={(e: any) => setTo(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estado</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={status}
            onChange={(e: any) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="cleared">Conciliado</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="inline-flex items-center gap-2 rounded px-4 py-2 border"
          onClick={() => push({ q, from, to, status })}
        >
          <span className="emoji">🔎</span> Aplicar filtros
        </button>
        <button
          className="inline-flex items-center gap-2 rounded px-4 py-2 border"
          onClick={() => {
            setQ("");
            setFrom("");
            setTo("");
            setStatus("");
            push({ q: undefined, from: undefined, to: undefined, status: undefined });
          }}
          type="button"
        >
          <span className="emoji">🧹</span> Limpiar
        </button>
      </div>
    </div>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function RemindersFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  const initial = useMemo(() => Object.fromEntries(search.entries()), [search]);

  const [q, setQ] = useState(initial.q ?? "");
  const [status, setStatus] = useState<string[]>(initial.status ? initial.status.split(",") : []);
  const [channel, setChannel] = useState<string[]>(
    initial.channel ? initial.channel.split(",") : [],
  );
  const [dateField, setDateField] = useState((initial.dateField ?? "created").toLowerCase());
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");

  function toggle(list: string[], v: string) {
    return list.includes(v) ? list.filter((x: any) => x !== v) : [...list, v];
  }

  function apply() {
    const p = new URLSearchParams(initial as any);
    function setOrDel(k: string, v?: string) {
      if (v && v.trim()) p.set(k, v.trim());
      else p.delete(k);
    }
    setOrDel("q", q);
    setOrDel("status", status.join(","));
    setOrDel("channel", channel.join(","));
    setOrDel("dateField", dateField);
    setOrDel("from", from);
    setOrDel("to", to);
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  function reset() {
    router.push(pathname);
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Buscar</label>
          <input
            className="rounded border px-3 py-2 w-full"
            value={q}
            onChange={(e: any) => setQ(e.target.value)}
            placeholder="Destino, plantilla…"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Campo de fecha</label>
          <select
            className="rounded border px-3 py-2 w-full"
            value={dateField}
            onChange={(e: any) => setDateField(e.target.value)}
          >
            <option value="created">Creación</option>
            <option value="lastAttempt">Último intento</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Desde</label>
          <input
            type="date"
            className="rounded border px-3 py-2 w-full"
            value={from}
            onChange={(e: any) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Hasta</label>
          <input
            type="date"
            className="rounded border px-3 py-2 w-full"
            value={to}
            onChange={(e: any) => setTo(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Estado</label>
          <div className="flex flex-wrap gap-2">
            {["scheduled", "sent", "failed", "retry"].map((s: any) => (
              <button
                key={s}
                type="button"
                className={`px-3 py-1.5 rounded border text-sm ${status.includes(s) ? "bg-white" : "opacity-60"}`}
                onClick={() => setStatus((prev: any) => toggle(prev, s))}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Canal</label>
          <div className="flex flex-wrap gap-2">
            {["whatsapp", "sms"].map((c: any) => (
              <button
                key={c}
                type="button"
                className={`px-3 py-1.5 rounded border text-sm ${channel.includes(c) ? "bg-white" : "opacity-60"}`}
                onClick={() => setChannel((prev: any) => toggle(prev, c))}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
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

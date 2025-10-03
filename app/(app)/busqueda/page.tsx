"use client";

import { useEffect, useState } from "react";
import { searchAll, type SearchItem } from "@/lib/search";
import { getActiveOrg } from "@/lib/org-local";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [onlyOrg, setOnlyOrg] = useState(true);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const active = getActiveOrg();

  async function run() {
    setLoading(true);
    try {
      setItems(await searchAll(q, onlyOrg, 40, 0));
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void run(); /* eslint-disable-next-line */
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Búsqueda</h1>
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
        <Input
          className="sm:col-span-4"
          placeholder="Buscar pacientes y notas…"
          value={q}
          onChange={(e: any) => setQ(e.target.value)}
          onKeyDown={(e: any) => {
            if (e.key === "Enter") void run();
          }}
        />
        <label className="flex items-center gap-2 text-sm justify-center">
          <input type="checkbox" checked={onlyOrg} onChange={(e: any) => setOnlyOrg(e.target.checked)} />
          Sólo org activa
        </label>
        <Button onClick={() => void run()} disabled={loading}>
          Buscar
        </Button>
      </div>

      <div className="border rounded-xl divide-y bg-white">
        {items.length === 0 && (
          <div className="p-4 text-sm text-gray-600">
            {loading ? "Buscando…" : "Sin resultados."}
          </div>
        )}
        {items.map((it: any, idx: any) => (
          <div key={idx} className="p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {it.kind === "patient" ? "Paciente" : "Nota"}
              </div>
              <div className="font-medium">{it.title}</div>
              {it.snippet && <div className="text-sm text-gray-600 line-clamp-2">{it.snippet}</div>}
            </div>
            <Button variant="secondary" onClick={() => router.push(`/pacientes/${it.patient_id}`)}>
              Abrir
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Org activa: <strong>{active.name ?? "—"}</strong> ({active.id?.slice(0, 8) ?? "sin org"})
      </p>
    </div>
  );
}

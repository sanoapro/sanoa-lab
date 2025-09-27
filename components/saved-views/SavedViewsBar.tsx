"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SavedView = { id: string; org_id: string; user_id: string; scope: string; name: string; filters: Record<string, any>; created_at: string };

type Props = {
  orgId: string;
  scope: "bank_tx"; // extensible a otros módulos
};

export default function SavedViewsBar({ orgId, scope }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [items, setItems] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [name, setName] = useState("");

  const currentFilters = useMemo(() => {
    const q = Object.fromEntries(search.entries());
    // No persistimos parámetros volátiles
    delete q.page;
    delete q.pageSize;
    // org_id siempre se reinyecta al aplicar
    delete q.org_id;
    return q;
  }, [search]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/saved-views?org_id=${orgId}&scope=${scope}`)
      .then(r => r.json())
      .then(j => { if (!alive) return; if (j.ok) setItems(j.data); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [orgId, scope]);

  function applyFilters(filters: Record<string, any>) {
    const q = new URLSearchParams();
    q.set("org_id", orgId);
    Object.entries(filters).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      q.set(k, String(v));
    });
    q.set("page", "1");
    router.push(`${pathname}?${q.toString()}`);
  }

  async function saveNew() {
    if (!name.trim()) return;
    const res = await fetch("/api/saved-views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, item: { scope, name: name.trim(), filters: currentFilters } })
    });
    const j = await res.json();
    if (j.ok) {
      const v = j.data[0] as SavedView;
      setItems(prev => [v, ...prev]);
      setSelectedId(v.id);
      setName("");
    }
  }

  async function updateSelected() {
    if (!selectedId) return;
    const sv = items.find(i => i.id === selectedId);
    if (!sv) return;
    const res = await fetch("/api/saved-views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org_id: orgId, item: { id: sv.id, scope, name: sv.name, filters: currentFilters } })
    });
    const j = await res.json();
    if (j.ok) {
      const v = j.data[0] as SavedView;
      setItems(prev => prev.map(x => x.id === v.id ? v : x));
    }
  }

  async function removeSelected() {
    if (!selectedId) return;
    const res = await fetch(`/api/saved-views/${selectedId}?org_id=${orgId}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) {
      setItems(prev => prev.filter(x => x.id !== selectedId));
      setSelectedId("");
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-end gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm">Vistas guardadas</label>
        <select
          value={selectedId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedId(id);
            const sv = items.find(x => x.id === id);
            if (sv) applyFilters(sv.filters || {});
          }}
          className="rounded border px-3 py-2"
          aria-label="Seleccionar vista guardada"
        >
          <option value="">(ninguna)</option>
          {items.map(v => (<option key={v.id} value={v.id}>{v.name}</option>))}
        </select>
        <button className="rounded px-3 py-2 border" onClick={updateSelected} disabled={!selectedId}>Actualizar</button>
        <button className="rounded px-3 py-2 border" onClick={removeSelected} disabled={!selectedId}>Eliminar</button>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre de la vista"
          className="rounded border px-3 py-2"
          aria-label="Nombre de nueva vista"
        />
        <button className="rounded px-3 py-2 border" onClick={saveNew} disabled={!name.trim()}>Guardar vista</button>
      </div>
    </div>
  );
}

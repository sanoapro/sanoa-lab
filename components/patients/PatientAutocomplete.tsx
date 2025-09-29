// components/patients/PatientAutocomplete.tsx
"use client";
import { useEffect, useRef, useState } from "react";

export default function PatientAutocomplete({
  orgId,
  scope = "mine",
  onSelect,
  placeholder = "Buscar paciente…",
}: {
  orgId: string;
  scope?: "mine" | "org";
  onSelect: (item: { id: string; label: string }) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => {
    if (!q.trim()) { setItems([]); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const p = new URLSearchParams({ org_id: orgId, q, scope });
      const r = await fetch(`/api/patients/autocomplete?${p.toString()}`, { cache:"no-store" });
      const j = await r.json();
      setItems(j?.ok ? j.data : []);
      setOpen(true);
    }, 150);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q, orgId, scope]);

  return (
    <div className="relative">
      <input
        aria-autocomplete="list"
        aria-expanded={open}
        className="border rounded px-3 py-2 w-full"
        value={q}
        onChange={(e)=>setQ(e.target.value)}
        onFocus={()=>{ if (items.length) setOpen(true); }}
        onBlur={()=> setTimeout(()=>setOpen(false), 100)}
        placeholder={placeholder}
      />
      {open && items.length > 0 && (
        <ul role="listbox" className="absolute z-10 bg-white border rounded mt-1 max-h-64 overflow-auto w-full shadow">
          {items.map(it=>(
            <li
              role="option"
              key={it.id}
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
              onMouseDown={(e)=>{ e.preventDefault(); onSelect(it); setQ(it.label); setOpen(false); }}
            >
              {it.label}
            </li>
          ))}
        </ul>
      )}
      {open && !items.length && (
        <div className="absolute z-10 bg-white border rounded mt-1 w-full px-3 py-2 text-sm text-slate-500">Sin resultados</div>
      )}
    </div>
  );
}

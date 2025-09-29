// components/patients/PatientAutocomplete.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Option = { id: string; label: string };

export default function PatientAutocomplete({
  orgId,
  scope = "mine",
  placeholder = "Buscar paciente…",
  onSelect,
}: {
  orgId: string;
  scope?: "mine" | "org";
  placeholder?: string;
  onSelect?: (opt: Option | null) => void;
}) {
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<Option[]>([]);
  const [show, setShow] = useState(false);
  const boxRef = useRef<HTMLDivElement|null>(null);

  const debounced = useDebounced(q, 180);

  useEffect(() => {
    async function run() {
      if (!orgId || debounced.trim().length < 2) { setOpts([]); return; }
      // Reutiliza tu buscador genérico
      const p = new URLSearchParams({ scope: "patients", org_id: orgId, q: debounced, mine: scope==="mine" ? "1":"0", limit:"10" });
      const r = await fetch(`/api/search/query?${p.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.ok && Array.isArray(j.data)) {
        const mapped: Option[] = j.data.map((x: any) => ({ id: x.id || x.patient_id || x.value || String(x), label: x.label || x.name || x.title || x.text || "Paciente" }));
        setOpts(mapped.slice(0,10));
      } else {
        setOpts([]);
      }
    }
    run();
  }, [orgId, debounced, scope]);

  useEffect(() => {
    function clickAway(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setShow(false);
    }
    window.addEventListener("click", clickAway);
    return () => window.removeEventListener("click", clickAway);
  }, []);

  function choose(o: Option) {
    onSelect?.(o);
    setQ(o.label);
    setShow(false);
  }

  return (
    <div className="relative" ref={boxRef}>
      <input
        className="border rounded px-3 py-2 w-full"
        placeholder={placeholder}
        value={q}
        onChange={(e)=>{ setQ(e.target.value); setShow(true); }}
        onFocus={()=> setShow(true)}
        aria-autocomplete="list"
        aria-expanded={show}
      />
      {show && opts.length > 0 && (
        <div className="absolute z-20 bg-white border rounded-lg mt-1 w-full max-h-64 overflow-auto shadow">
          {opts.map(o=>(
            <button
              key={o.id}
              className="block w-full text-left px-3 py-2 hover:bg-slate-50"
              onClick={()=> choose(o)}
            >{o.label}</button>
          ))}
        </div>
      )}
      {show && q.length >= 2 && opts.length === 0 && (
        <div className="absolute z-20 bg-white border rounded-lg mt-1 w-full px-3 py-2 text-sm text-slate-500">Sin resultados</div>
      )}
    </div>
  );
}

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(()=>{ const id = setTimeout(()=> setV(value), ms); return ()=> clearTimeout(id); }, [value, ms]);
  return v;
}

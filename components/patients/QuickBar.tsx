// components/patients/QuickBar.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { fetchPatientSuggestions, type PatientSuggestion } from "@/lib/patients-search";
import { getActiveOrg } from "@/lib/org-local";
import ColorEmoji from "@/components/ColorEmoji";

type Props = {
  placeholder?: string;
  limit?: number;
  scope?: "mine" | "org";
  providerId?: string; // si quieres forzar scope por proveedor específico
};

export default function QuickBar({ placeholder = "Buscar paciente por nombre, teléfono o email…", limit = 8, scope = "mine", providerId }: Props) {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [items, setItems] = React.useState<PatientSuggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const org = getActiveOrg(); // localStorage { id, name }

  React.useEffect(() => {
    if (!org.id) return; // no org -> no search
    if (value.trim().length === 0) {
      setItems([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const t = setTimeout(async () => {
      try {
        const results = await fetchPatientSuggestions({
          orgId: org.id!,
          q: value.trim(),
          limit,
          scope,
          providerId,
          signal: ctrl.signal,
        });
        setItems(results);
        setActive(0);
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    }, 150); // debounce

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, org.id, limit, scope, providerId]);

  function onPick(idx: number) {
    const item = items[idx];
    if (!item) return;
    setOpen(false);
    setValue("");
    // Navega al detalle del paciente
    router.push(`/pacientes/${item.id}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
      scrollIntoView(active + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
      scrollIntoView(active - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onPick(active);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function scrollIntoView(idx: number) {
    const el = listRef.current?.children?.[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }

  return (
    <div className="relative w-full max-w-xl" role="combobox" aria-expanded={open} aria-owns="patient-quickbar-list" aria-haspopup="listbox">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/60 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
        <span aria-hidden="true" className="inline-grid h-5 w-5 place-content-center opacity-80">
          <ColorEmoji token="buscador" />
        </span>
        <input
          aria-autocomplete="list"
          aria-controls="patient-quickbar-list"
          aria-activedescendant={open && items[active]?.id ? `patient-opt-${items[active].id}` : undefined}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
        />
        {loading ? (
          <span className="text-xs text-slate-500">Buscando…</span>
        ) : value && open ? (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setOpen(false);
            }}
            className="text-xs text-slate-500 hover:text-slate-700"
            aria-label="Limpiar búsqueda"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      {open && value.trim().length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
          <ul id="patient-quickbar-list" ref={listRef} role="listbox" className="max-h-80 overflow-auto divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 && !loading ? (
              <li className="px-3 py-3 text-sm text-slate-500">Sin resultados</li>
            ) : (
              items.map((it, idx) => (
                <li
                  id={`patient-opt-${it.id}`}
                  role="option"
                  aria-selected={idx === active}
                  key={it.id}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => onPick(idx)}
                  className={[
                    "px-3 py-2 cursor-pointer flex items-center justify-between gap-3",
                    idx === active ? "bg-blue-50 dark:bg-white/10" : "",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900 dark:text-slate-100">{it.full_name}</div>
                    {(it.phone || it.email) && (
                      <div className="truncate text-xs text-slate-500">
                        {it.phone ? `📞 ${it.phone}` : null}
                        {it.phone && it.email ? " · " : ""}
                        {it.email ? `✉️ ${it.email}` : null}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-slate-500">Abrir</div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

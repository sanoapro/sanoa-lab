"use client";

import { useEffect, useRef, useState } from "react";

import { useActiveOrg } from "@/hooks/useActiveOrg";
import { listMyOrgs, type MyOrg } from "@/lib/org";
import { cn } from "@/lib/utils";

type OrgItem = { id: string; name: string; slug?: string };

function normalize(item: MyOrg): OrgItem {
  return {
    id: item.id,
    name: item.is_personal ? "Personal" : item.name,
    slug: item.slug ?? undefined,
  };
}

export default function OrgSwitcher() {
  const { org, loading, setActive } = useActiveOrg();
  const [items, setItems] = useState<OrgItem[]>([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    setFetching(true);

    (async () => {
      try {
        const list = await listMyOrgs();
        if (!mounted) return;
        const mapped = list.map(normalize);
        setItems(mapped);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setItems([]);
        setError("No se pudieron cargar las organizaciones.");
      } finally {
        if (mounted) setFetching(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function onPick(item: OrgItem) {
    setActive(item);
    setOpen(false);
  }

  const label = (() => {
    if (org) return org.name;
    if (fetching || loading) return "Cargando organización…";
    return "Elige organización";
  })();

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        className="glass-btn inline-flex items-center gap-2"
        onClick={() => setOpen((value: any) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={loading && !org}
      >
        <span aria-hidden>🏢</span>
        <span className="max-w-[180px] truncate">{label}</span>
        <span className="text-xs opacity-70" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 min-w-[220px] space-y-2 rounded-xl bg-white/90 p-2 text-sm shadow-lg backdrop-blur-sm dark:bg-slate-900/90">
          {fetching && (
            <div className="px-2 py-1 text-contrast/70">Cargando organizaciones…</div>
          )}
          {error && !fetching && (
            <div className="px-2 py-1 text-rose-600">{error}</div>
          )}
          {!fetching && !error && items.length === 0 && (
            <div className="px-2 py-1 text-contrast/70">No se encontraron organizaciones</div>
          )}
          <ul className="max-h-64 overflow-auto" role="listbox">
            {items.map((item: any) => {
              const isActive = org?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-lg px-2 py-2 text-left transition hover:bg-black/5 dark:hover:bg-white/10",
                      isActive && "bg-black/5 font-semibold dark:bg-white/10",
                    )}
                    onClick={() => onPick(item)}
                    aria-selected={isActive}
                    role="option"
                  >
                    {item.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

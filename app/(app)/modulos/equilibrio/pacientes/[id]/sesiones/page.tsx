"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";

type Item = { id: string; date: string; created_at: string; updated_at: string };

export default function SessionsList({ params }: { params: { id: string } }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/modules/equilibrio/sesiones/list?patient_id=${params.id}`);
        const j = await r.json();
        setItems(j?.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  return (
    <div className="p-6 space-y-4">
      <AccentHeader emoji="🧘">Sesiones del paciente</AccentHeader>
      <div>
        <Link
          href={`/modulos/equilibrio/pacientes/${params.id}/sesiones/new`}
          className="underline"
        >
          + Nueva sesión
        </Link>
      </div>
      {loading ? (
        <div className="opacity-70 text-sm">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="opacity-70 text-sm">Sin sesiones registradas.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between border rounded p-2">
              <div className="text-sm">
                <div className="font-medium">{new Date(it.date).toLocaleString()}</div>
                <div className="opacity-60 text-xs">
                  Creado: {new Date(it.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <Link className="underline" href={`/modulos/equilibrio/sesiones/${it.id}`}>
                  Abrir
                </Link>
                <a
                  className="underline"
                  href={`/print/equilibrio/sesiones/${it.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Imprimir
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

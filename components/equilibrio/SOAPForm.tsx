"use client";

import { useState } from "react";

export type SOAPValue = { S: string; O: string; A: string; P: string };

export default function SOAPForm({
  initial,
  onSubmit,
  submitting = false,
}: {
  initial?: Partial<SOAPValue>;
  onSubmit: (v: SOAPValue) => void | Promise<void>;
  submitting?: boolean;
}) {
  const [S, setS] = useState(initial?.S || "");
  const [O, setO] = useState(initial?.O || "");
  const [A, setA] = useState(initial?.A || "");
  const [P, setP] = useState(initial?.P || "");

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm">S — Subjetivo</span>
        <textarea
          aria-label="Subjetivo"
          className="w-full border p-2 rounded"
          rows={4}
          value={S}
          onChange={(e: any) => setS(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm">O — Objetivo</span>
        <textarea
          aria-label="Objetivo"
          className="w-full border p-2 rounded"
          rows={4}
          value={O}
          onChange={(e: any) => setO(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm">A — Análisis</span>
        <textarea
          aria-label="Análisis"
          className="w-full border p-2 rounded"
          rows={4}
          value={A}
          onChange={(e: any) => setA(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm">P — Plan</span>
        <textarea
          aria-label="Plan"
          className="w-full border p-2 rounded"
          rows={4}
          value={P}
          onChange={(e: any) => setP(e.target.value)}
        />
      </label>

      <button
        disabled={submitting}
        className="px-3 py-2 rounded bg-black text-white hover:opacity-90 active:opacity-80 transition"
        onClick={() => onSubmit({ S, O, A, P })}
      >
        {submitting ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}

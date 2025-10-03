"use client";

import { useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/Toaster";

type Result = {
  kind: "note" | "file";
  id: string | null;
  patient_id: string;
  ref: string | null;
  snippet: string;
  score: number;
};

export default function SearchPage() {
  const org = getActiveOrg();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Result[]>([]);
  const [mode, setMode] = useState<"semantic" | "keyword" | "">("");
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!org.id) {
      showToast({ title: "Selecciona organización activa" });
      return;
    }
    setLoading(true);
    try {
      const j = await fetch(`/api/search/query?q=${encodeURIComponent(q)}&org=${org.id}`).then(
        (r: any) => r.json(),
      );
      setRows(j.results || []);
      setMode(j.mode || "");
    } catch (e: any) {
      showToast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function reindex(scope: "notes" | "files") {
    if (!org.id) return;
    setLoading(true);
    try {
      const j = await fetch(`/api/search/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: org.id, scope }),
      }).then((r: any) => r.json());
      if (!j.ok) throw new Error(j.error || "Falló el indexado");
      showToast({
        title: "Indexado",
        description: `${scope}: ${j.indexed} registros (${j.model})`,
      });
    } catch (e: any) {
      showToast({ title: "Error indexando", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-5 space-y-5">
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Buscador</h1>
      <div className="glass glass-card bubble p-5 space-y-4 text-contrast">
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e: any) => setQ(e.target.value)}
            placeholder="Ej: ansiedad, informe laboratorio, etc."
          />
          <Button onClick={() => void run()} disabled={loading} className="glass-btn neon">
            {loading ? "🔍 Buscando…" : "🚀 Buscar"}
          </Button>
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => void reindex("notes")} disabled={loading} className="glass-btn">
            📝 Reindexar notas
          </Button>
          <Button
            variant="secondary"
            className="glass-btn"
            onClick={() => void reindex("files")}
            disabled={loading}
          >
            📁 Reindexar archivos
          </Button>
          {mode && (
            <span className="ml-1 text-xs text-foreground/80">
              Modo: <strong>{mode}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="glass glass-card bubble text-contrast divide-y divide-black/5 dark:divide-white/10">
        {rows.length === 0 && (
          <div className="p-4 text-sm opacity-80">Sin resultados.</div>
        )}
        {rows.map((r: any, i: any) => (
          <div key={i} className="p-3">
            <div className="text-xs opacity-80">
              {r.kind === "note" ? "Nota" : "Archivo"} · Paciente {r.patient_id.slice(0, 8)}… ·
              score {r.score.toFixed(2)}
            </div>
            <div className="whitespace-pre-wrap text-base leading-relaxed">{r.snippet}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/Toaster";

type SearchMode = "semantic" | "keyword" | "";
type ResultKind = "note" | "file";

type Result = {
  kind: ResultKind;
  id: string | null;
  patient_id: string | null;
  ref: string | null;
  snippet: string;
  score: number | null;
};

type QueryResponse =
  | {
      ok: boolean;
      mode: SearchMode;
      results: Result[];
      error?: string;
    }
  | {
      ok: false;
      mode?: SearchMode;
      results?: Result[];
      error: string;
    };

export default function SearchPage() {
  const org = getActiveOrg() as { id?: string } | null;
  const orgId = org?.id ?? "";

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Result[]>([]);
  const [mode, setMode] = useState<SearchMode>("");
  const [loading, setLoading] = useState(false);

  const canSearch = useMemo(() => Boolean(orgId) && q.trim().length > 0, [orgId, q]);

  const run = useCallback(async () => {
    if (!orgId) {
      showToast({ title: "Selecciona organización activa" });
      return;
    }
    if (!q.trim()) {
      showToast({ title: "Escribe algo para buscar" });
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), org: orgId });
      const res = await fetch(`/api/search/query?${params.toString()}`, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as QueryResponse;

      if (!res.ok || (j && "ok" in j && !j.ok)) {
        throw new Error(j?.error || "No se pudo ejecutar la búsqueda");
      }

      setRows(j?.results ?? []);
      setMode(j?.mode ?? "");
    } catch (e: any) {
      setRows([]);
      setMode("");
      showToast({ title: "Error", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [orgId, q]);

  const reindex = useCallback(
    async (scope: "notes" | "files") => {
      if (!orgId) {
        showToast({ title: "Selecciona organización activa" });
        return;
      }
      setLoading(true);
      try {
        const r = await fetch(`/api/search/index`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ org_id: orgId, scope }),
        });
        const j = (await r.json().catch(() => ({}))) as {
          ok?: boolean;
          indexed?: number;
          model?: string;
          error?: string;
        };
        if (!r.ok || !j?.ok) throw new Error(j?.error || "Falló el indexado");
        showToast({
          title: "Indexado completo",
          description: `${scope}: ${j.indexed ?? 0} registros (${j.model ?? "modelo desconocido"})`,
        });
      } catch (e: any) {
        showToast({
          title: "Error indexando",
          description: e?.message ?? String(e),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [orgId]
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Buscador</h1>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void run();
            }}
            placeholder="Ej: ansiedad, informe laboratorio, etc."
            aria-label="Consulta de búsqueda"
          />
          <Button onClick={() => void run()} disabled={loading || !canSearch} aria-busy={loading}>
            {loading ? "Buscando…" : "Buscar"}
          </Button>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => void reindex("notes")}
            disabled={loading || !orgId}
            title="Reconstruir índice de notas"
          >
            Reindexar notas
          </Button>
          <Button
            variant="secondary"
            onClick={() => void reindex("files")}
            disabled={loading || !orgId}
            title="Reconstruir índice de archivos"
          >
            Reindexar archivos
          </Button>
          {mode && (
            <span className="ml-1">
              Modo: <strong>{mode}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="glass rounded-xl divide-y divide-black/5 dark:divide-white/10">
        {rows.length === 0 && (
          <div className="p-4 text-sm text-slate-600 dark:text-slate-300">Sin resultados.</div>
        )}

        {rows.map((r) => {
          const key = `${r.kind}-${r.id ?? r.ref ?? Math.random().toString(36).slice(2)}`;
          const pid = r.patient_id ? `${r.patient_id.slice(0, 8)}…` : "—";
          const score =
            typeof r.score === "number" && Number.isFinite(r.score)
              ? r.score.toFixed(2)
              : "—";

          return (
            <div key={key} className="p-3">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {r.kind === "note" ? "Nota" : "Archivo"} · Paciente {pid} · score {score}
              </div>
              <div className="text-slate-900 dark:text-white whitespace-pre-wrap">{r.snippet}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

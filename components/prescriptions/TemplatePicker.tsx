"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import TemplateEditorModal, { RxTemplate } from "./TemplateEditorModal";

type Props = {
  orgId?: string;
  mine?: boolean;
  onSelect?: (_tpl: RxTemplate) => void;
  /** @deprecated usa onSelect */
  onChoose?: (_tpl: RxTemplate) => void;
};

type ApiTemplate = Partial<RxTemplate> & {
  id?: string;
  org_id?: string | null;
  name?: string;
  content?: unknown;
  body?: string;
  title?: string;
  specialty?: string | null;
  notes?: string | null;
  is_reference?: boolean | null;
};

function normalizeTemplate(raw: ApiTemplate): RxTemplate {
  const content = (raw.content ?? {}) as Record<string, unknown>;
  const specialty = (raw.specialty ?? content.specialty ?? "") as string;
  const title = (raw.title ?? raw.name ?? (content.title as string) ?? "") as string;
  const body = (raw.body ?? (content.body as string) ?? "") as string;
  const notes = (raw.notes ?? (content.notes as string | null) ?? null) || null;
  const isReference = (raw.is_reference ?? (content.is_reference as boolean | null) ?? false) || false;
  return {
    id: raw.id,
    org_id: raw.org_id ?? (content.org_id as string | null) ?? null,
    specialty,
    title,
    body,
    notes,
    is_reference: isReference,
  };
}

export default function TemplatePicker({ orgId, mine = false, onSelect, onChoose }: Props) {
  const [q, setQ] = useState("");
  const [templates, setTemplates] = useState<RxTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<RxTemplate | null>(null);
  const hasOrg = Boolean(orgId);

  const fetchUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (orgId) params.set("org_id", orgId);
    if (mine) params.set("mine", "1");
    if (q.trim()) params.set("q", q.trim());
    const query = params.toString();
    return query ? `/api/prescriptions/templates?${query}` : "/api/prescriptions/templates";
  }, [orgId, mine, q]);

  const load = useCallback(async () => {
    if (!hasOrg) {
      setTemplates([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(fetchUrl, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; data?: ApiTemplate[]; items?: ApiTemplate[]; error?: { message?: string } }
        | ApiTemplate[]
        | null;
      if (!res.ok) {
        const message =
          (json && "error" in json && json.error?.message) || json?.toString() || "No se pudieron cargar las plantillas";
        throw new Error(message);
      }
      const list: ApiTemplate[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? (json?.data as ApiTemplate[])
        : Array.isArray(json?.items)
        ? (json?.items as ApiTemplate[])
        : [];
      setTemplates(list.map((item) => normalizeTemplate(item)));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error inesperado");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [fetchUrl, hasOrg]);

  useEffect(() => {
    if (!hasOrg) return;
    void load();
  }, [hasOrg, load]);

  const handleSelect = useCallback(
    (tpl: RxTemplate) => {
      onSelect?.(tpl);
      onChoose?.(tpl);
    },
    [onChoose, onSelect],
  );

  const handleCreate = () => {
    setCurrent({
      org_id: orgId ?? null,
      specialty: "",
      title: "",
      body: "",
      notes: "",
      is_reference: false,
    });
    setOpen(true);
  };

  const handleEdit = (tpl: RxTemplate) => {
    setCurrent(tpl);
    setOpen(true);
  };

  const handleSaved = useCallback(
    (tpl: RxTemplate) => {
      setTemplates((prev) => {
        if (!tpl.id) {
          void load();
          return prev;
        }
        const idx = prev.findIndex((item) => item.id === tpl.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = tpl;
          return copy;
        }
        return [tpl, ...prev];
      });
      setCurrent(tpl);
    },
    [load],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:max-w-xl">
          <label className="text-sm text-contrast/70" htmlFor="template-search">
            Buscar plantilla
          </label>
          <div className="flex gap-2">
            <input
              id="template-search"
              className="input flex-1"
              placeholder="Buscar plantilla..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && hasOrg) void load();
              }}
              disabled={!hasOrg}
            />
            <button className="glass-btn" onClick={load} disabled={loading || !hasOrg}>
              {loading ? "Cargando..." : "Buscar"}
            </button>
          </div>
        </div>
        <button className="glass-btn primary self-end sm:self-auto" onClick={handleCreate} disabled={!hasOrg}>
          ➕ Nueva
        </button>
      </div>

      {!hasOrg ? (
        <div className="text-sm text-contrast/60">Selecciona una organización para ver o crear plantillas.</div>
      ) : null}

      {error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl) => (
          <div key={tpl.id ?? tpl.title} className="glass-card bubble text-contrast">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm text-contrast/70">{tpl.specialty || "General"}</div>
                <div className="font-semibold">{tpl.title || "Sin título"}</div>
                <div className="badge mt-1">
                  {tpl.is_reference ? "📝 Referencia" : "💊 Receta"}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="glass-btn" onClick={() => handleSelect(tpl)} disabled={!tpl.id}>
                  📥 Usar
                </button>
                <button className="glass-btn" onClick={() => handleEdit(tpl)}>
                  ✏️ Editar
                </button>
              </div>
            </div>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-contrast/80">{tpl.body}</pre>
            {tpl.notes ? <div className="mt-2 text-sm text-contrast/70">⚠️ {tpl.notes}</div> : null}
          </div>
        ))}
        {!templates.length && !loading && !error && hasOrg ? (
          <div className="rounded border border-dashed border-contrast/30 p-6 text-center text-sm text-contrast/70">
            Sin plantillas
          </div>
        ) : null}
      </div>

      {current ? (
        <TemplateEditorModal
          key={current.id ?? "new"}
          open={open}
          onClose={() => setOpen(false)}
          initial={current}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}

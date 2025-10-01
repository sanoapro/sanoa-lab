// components/prescriptions/TemplatePicker.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TemplateEditorModal, { RxTemplate } from "./TemplateEditorModal";
import TemplateLibraryModal from "@/components/templates/TemplateLibraryModal";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { SEED_TEMPLATES } from "@/lib/templates.seed";

type Props = {
  mine?: boolean;
  onSelect?: (_tpl: RxTemplate) => void;
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

export default function TemplatePicker({ mine = false, onSelect }: Props) {
  const { org } = useActiveOrg();
  const [q, setQ] = useState("");
  const [templates, setTemplates] = useState<RxTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openEditor, setOpenEditor] = useState(false);
  const [current, setCurrent] = useState<RxTemplate | null>(null);
  const [openLibrary, setOpenLibrary] = useState(false);

  const activeOrgId = useMemo(() => org?.id ?? null, [org?.id]);

  const load = useCallback(
    async (search?: string) => {
      const params = new URLSearchParams();
      if (activeOrgId) params.set("org_id", activeOrgId);
      if (mine) params.set("mine", "1");
      const trimmed = (search ?? q).trim();
      if (trimmed) params.set("q", trimmed);
      const qs = params.toString();
      const url = qs ? `/api/prescriptions/templates?${qs}` : "/api/prescriptions/templates";

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: ApiTemplate[]; items?: ApiTemplate[]; error?: { message?: string } }
          | ApiTemplate[]
          | null;
        if (!res.ok) {
          const message =
            (json && "error" in json && json.error?.message) ||
            json?.toString() ||
            "No se pudieron cargar las plantillas";
          throw new Error(message);
        }
        const list: ApiTemplate[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.items)
          ? (json?.items as ApiTemplate[])
          : Array.isArray(json?.data)
          ? (json?.data as ApiTemplate[])
          : [];
        setTemplates(list.map((item) => normalizeTemplate(item)));
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Error inesperado");
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    },
    [activeOrgId, mine, q],
  );

  async function importSeed() {
    if (!activeOrgId || importing) return;
    setImporting(true);
    try {
      const payload = SEED_TEMPLATES.map((tpl) => ({
        ...tpl,
        org_id: activeOrgId,
      }));
      const r = await fetch("/api/prescriptions/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => null);
      const ok = r.ok && (j?.ok !== false || Array.isArray(j?.items));
      if (!ok) {
        const message = j?.error?.message ?? "Error al importar plantillas";
        console.error(message);
        alert(message);
        return;
      }
      await load();
    } catch (err) {
      console.error(err);
      alert("No se pudo importar la base de plantillas");
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelect = useCallback(
    (tpl: RxTemplate) => {
      onSelect?.(tpl);
    },
    [onSelect],
  );

  const handleCreate = () => {
    setCurrent({
      org_id: activeOrgId ?? null,
      specialty: "",
      title: "",
      body: "",
      notes: "",
      is_reference: false,
    });
    setOpenEditor(true);
  };

  const handleEdit = (tpl: RxTemplate) => {
    setCurrent(tpl);
    setOpenEditor(true);
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
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Buscador */}
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
                if (e.key === "Enter") void load(e.currentTarget.value);
              }}
            />
            <button className="glass-btn" onClick={() => void load()} disabled={loading}>
              {loading ? "⏳ Cargando..." : "🔎 Buscar"}
            </button>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 self-end sm:self-auto">
          <button className="glass-btn" onClick={() => setOpenLibrary(true)}>
            📚 Biblioteca
          </button>
          <button
            className="glass-btn"
            onClick={() => void importSeed()}
            disabled={!activeOrgId || loading || importing}
          >
            {importing ? "⏳ Importando..." : "📦 Importar base"}
          </button>
          <button className="glass-btn primary" onClick={handleCreate}>
            ➕ Nueva
          </button>
        </div>
      </div>

      {error ? <div className="text-sm text-red-500">{error}</div> : null}

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl) => (
          <div key={tpl.id ?? tpl.title} className="glass-card bubble text-contrast">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm text-contrast/70">{tpl.specialty || "General"}</div>
                <div className="font-semibold">{tpl.title || "Sin título"}</div>
                <div className="badge mt-1">{tpl.is_reference ? "📝 Referencia" : "💊 Receta"}</div>
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
        {!templates.length && !loading && !error ? (
          <div className="rounded border border-dashed border-contrast/30 p-6 text-center text-sm text-contrast/70">
            Sin plantillas
          </div>
        ) : null}
      </div>

      {/* Editor */}
      {current ? (
        <TemplateEditorModal
          key={current.id ?? "new"}
          open={openEditor}
          onClose={() => setOpenEditor(false)}
          initial={current}
          onSaved={handleSaved}
        />
      ) : null}

      {/* Biblioteca / Administración */}
      <TemplateLibraryModal
        kind="prescription"
        orgId={activeOrgId ?? ""}
        open={openLibrary}
        onClose={() => {
          setOpenLibrary(false);
          void load();
        }}
        onUse={(tpl) => {
          handleSelect({
            id: tpl.id,
            org_id: activeOrgId ?? null,
            specialty: (tpl as any)?.specialty ?? "",
            title: tpl.name ?? "",
            body: (tpl as any)?.body ?? "",
            notes: null,
            is_reference: false,
          });
          setOpenLibrary(false);
        }}
      />
    </section>
  );
}

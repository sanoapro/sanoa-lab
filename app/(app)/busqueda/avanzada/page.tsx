"use client";

import { useEffect, useMemo, useState } from "react";
import { listMyTags, type Tag } from "@/lib/tags";
import { searchAdvanced, type AdvancedSearchPayload, type SearchItem } from "@/lib/search-advanced";
import {
  listSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
  type SavedSearch,
} from "@/lib/saved-searches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/Toaster";
import { useRouter } from "next/navigation";
import clsx from "clsx";

type Gender = "ALL" | "F" | "M" | "O";

export default function AdvancedSearchPage() {
  const router = useRouter();

  // Filtros
  const [q, setQ] = useState("");
  const [genero, setGenero] = useState<Gender>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [onlyOrg, setOnlyOrg] = useState(true);

  // Etiquetas
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsAny, setTagsAny] = useState<string[]>([]);
  const [tagsAll, setTagsAll] = useState<string[]>([]);
  const [useAll, setUseAll] = useState(false);

  // Resultados
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Guardadas
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [name, setName] = useState("");
  const scopeDefault: "personal" | "org" = "personal";
  const [scope, setScope] = useState<"personal" | "org">(scopeDefault);

  function payload(): AdvancedSearchPayload {
    return { q, tagsAny, tagsAll, genero, from: from || undefined, to: to || undefined, onlyOrg };
  }

  async function run() {
    setLoading(true);
    try {
      setItems(await searchAdvanced(payload()));
    } catch (e: any) {
      showToast({ title: "Error al buscar", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function toggleTag(id: string) {
    if (useAll)
      setTagsAll((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
    else setTagsAny((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
  }

  async function save() {
    if (!name.trim()) {
      showToast({ title: "Nombre requerido", description: "Escribe un nombre para guardar." });
      return;
    }
    try {
      const s = await createSavedSearch(name.trim(), payload(), scope);
      setSaved([s, ...saved]);
      setName("");
      showToast({ title: "Guardada", description: "Búsqueda guardada correctamente." });
    } catch (e: any) {
      showToast({ title: "No se pudo guardar", description: e.message, variant: "destructive" });
    }
  }

  async function loadSaved() {
    try {
      setSaved(await listSavedSearches());
    } catch {}
  }
  async function loadTags() {
    try {
      setTags(await listMyTags());
    } catch {}
  }

  function applySaved(s: SavedSearch) {
    setQ(s.payload.q ?? "");
    setGenero((s.payload.genero as Gender) ?? "ALL");
    setFrom(s.payload.from ?? "");
    setTo(s.payload.to ?? "");
    setOnlyOrg(!!s.payload.onlyOrg);
    setUseAll((s.payload.tagsAll ?? []).length > 0);
    setTagsAll(s.payload.tagsAll ?? []);
    setTagsAny(s.payload.tagsAny ?? []);
    void (async () => {
      setLoading(true);
      try {
        setItems(await searchAdvanced(s.payload));
      } finally {
        setLoading(false);
      }
    })();
  }

  useEffect(() => {
    void loadTags();
    void loadSaved();
    void run();
  }, []);

  const tagSet = useMemo(() => new Set(useAll ? tagsAll : tagsAny), [useAll, tagsAll, tagsAny]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Búsqueda avanzada</h1>

      <div className="border rounded-xl p-4 bg-white space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          <Input
            className="sm:col-span-3"
            placeholder="Texto a buscar (pacientes + notas)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void run();
            }}
          />
          <select
            className="border rounded-md px-3 py-2"
            value={genero}
            onChange={(e) => setGenero(e.target.value as Gender)}
          >
            <option value="ALL">Género (todos)</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="O">Otro/No especifica</option>
          </select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={onlyOrg}
              onChange={(e) => setOnlyOrg(e.target.checked)}
            />
            Sólo org activa
          </label>
          <label className="text-xs flex items-center gap-2">
            <input
              type="checkbox"
              checked={useAll}
              onChange={(e) => {
                setUseAll(e.target.checked);
                setTagsAll([]);
                setTagsAny([]);
              }}
            />
            Requerir TODAS las etiquetas
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTag(t.id)}
              className={clsx(
                "px-3 py-1 rounded-full text-sm border",
                tagSet.has(t.id)
                  ? "bg-[#D97A66] text-white border-[#D97A66]"
                  : "bg-white text-[#3E4C59]",
              )}
            >
              {t.name}
            </button>
          ))}
          {tags.length === 0 && (
            <div className="text-sm text-gray-600">No tienes etiquetas aún.</div>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => void run()} disabled={loading}>
            Buscar
          </Button>
        </div>
      </div>

      <div className="border rounded-xl p-4 bg-white space-y-3">
        <div className="font-medium">Búsquedas guardadas</div>
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="Nombre (ej. 'Notas ansiedad 2025 Q3')"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="border rounded-md px-3 py-2"
            value={scope}
            onChange={(e) => setScope(e.target.value as any)}
          >
            <option value="personal">Personal</option>
            <option value="org">Organización activa</option>
          </select>
          <Button onClick={() => void save()}>Guardar búsqueda</Button>
        </div>
        <div className="divide-y rounded-lg border">
          {saved.length === 0 && (
            <div className="p-3 text-sm text-gray-600">Aún no tienes búsquedas guardadas.</div>
          )}
          {saved.map((s) => (
            <div key={s.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-gray-600">
                  Creada: {new Date(s.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => applySaved(s)}>
                  Aplicar
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await deleteSavedSearch(s.id);
                    setSaved(saved.filter((x) => x.id !== s.id));
                  }}
                >
                  Borrar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-xl divide-y bg-white">
        {items.length === 0 && (
          <div className="p-4 text-sm text-gray-600">
            {loading ? "Buscando…" : "Sin resultados."}
          </div>
        )}
        {items.map((it, idx) => (
          <div key={idx} className="p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {it.kind === "patient" ? "Paciente" : "Nota"}
              </div>
              <div className="font-medium">{it.title}</div>
              {it.snippet && <div className="text-sm text-gray-600 line-clamp-2">{it.snippet}</div>}
            </div>
            <Button variant="secondary" onClick={() => router.push(`/pacientes/${it.patient_id}`)}>
              Abrir
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

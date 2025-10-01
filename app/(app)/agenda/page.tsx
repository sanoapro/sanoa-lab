"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { fetchBookings, type CalBooking } from "@/lib/cal";
import { listPatients, type Patient } from "@/lib/patients";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toaster";
import ColorEmoji from "@/components/ColorEmoji";
import { getActiveOrg } from "@/lib/org-local";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Status = "upcoming" | "past" | "accepted" | "all";

type LocalAppt = {
  id: string;
  patient_id: string;
  start_at: string; // ISO
  end_at: string | null;
  cal_event_id: string | null;
};

type UniItem =
  | {
      kind: "cal";
      uid: string;
      title: string;
      start: string;
      end: string;
      meetingUrl?: string;
      attendee?: string;
    }
  | {
      kind: "local";
      id: string;
      title: string;
      start: string;
      end: string;
      patient_id: string;
      cal_event_id?: string | null;
    };

export default function AgendaPage() {
  const supabase = getSupabaseBrowser();
  const org = getActiveOrg() as { id?: string } | null;
  const orgId = org?.id ?? "";

  const [status, setStatus] = useState<Status>("upcoming");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  // datos
  const [calItems, setCalItems] = useState<CalBooking[]>([]);
  const [localItems, setLocalItems] = useState<LocalAppt[]>([]);

  // modal NUEVA CITA
  const [openNew, setOpenNew] = useState(false);

  // búsqueda paciente para nueva cita
  const [pQ, setPQ] = useState("");
  const [pList, setPList] = useState<Patient[]>([]);
  const [pSel, setPSel] = useState<Patient | null>(null);

  // formulario nueva cita
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(50);
  const [title, setTitle] = useState("Consulta");
  const [notes, setNotes] = useState("");
  const [busyCreate, setBusyCreate] = useState(false);

  // Formateadores consistentes en es-MX (zona MX)
  const dtDateTime = useMemo(
    () =>
      new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Mexico_City",
      }),
    []
  );
  const dtTime = useMemo(
    () =>
      new Intl.DateTimeFormat("es-MX", {
        timeStyle: "short",
        timeZone: "America/Mexico_City",
      }),
    []
  );

  const range = useMemo(() => {
    const afterStart = from ? new Date(from + "T00:00:00").toISOString() : undefined;
    const beforeEnd = to ? new Date(to + "T23:59:59").toISOString() : undefined;
    return { afterStart, beforeEnd };
  }, [from, to]);

  const exportUrl = useMemo(() => {
    if (!orgId) return "";
    const params = new URLSearchParams({ org_id: orgId });
    if (range.afterStart) params.set("from", range.afterStart);
    if (range.beforeEnd) params.set("to", range.beforeEnd);
    if (status !== "all") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    return `/api/export/agenda/xlsx?${params.toString()}`;
  }, [orgId, range.afterStart, range.beforeEnd, status, q]);

  // Carga unificada de Cal.com + citas locales
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Cal.com
      const bk = await fetchBookings({
        status: status === "all" ? undefined : status,
        q: q || undefined,
        ...range,
        take: 50,
      });
      setCalItems(bk);

      // Local (appointments)
      if (orgId) {
        let sel = supabase
          .from("appointments")
          .select("id, patient_id, start_at, end_at, cal_event_id")
          .eq("org_id", orgId)
          .order("start_at", { ascending: true })
          .limit(100);

        if (range.afterStart) sel = sel.gte("start_at", range.afterStart);
        if (range.beforeEnd) sel = sel.lte("start_at", range.beforeEnd);

        const { data, error } = await sel;
        if (error) {
          throw new Error(error.message || "No se pudieron cargar citas locales");
        }
        setLocalItems((data || []) as LocalAppt[]);
      } else {
        setLocalItems([]);
      }
    } catch (e: any) {
      showToast({ title: "Error", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [orgId, q, range, status, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  // Autocomplete paciente (nueva cita) — try/catch + cancelación simple
  useEffect(() => {
    let cancel = false;
    (async () => {
      const term = pQ.trim();
      if (!term) {
        setPList([]);
        return;
      }
      try {
        const res = await listPatients({
          q: term,
          page: 1,
          pageSize: 10,
          sortBy: "nombre",
          direction: "asc",
        });
        if (!cancel) setPList(res.items);
      } catch (e) {
        if (!cancel) setPList([]);
        // eslint-disable-next-line no-console
        console.warn("[agenda] listPatients failed", e);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [pQ]);

  function pickPatient(p: Patient) {
    setPSel(p);
    setPQ((p as any).nombre || (p as any).full_name || (p as any).email || "");
    setPList([]);
  }

  // Crear cita
  async function createAppt() {
    const dur = Number.isFinite(duration) ? Math.max(5, Math.min(480, duration)) : 50;
    if (!orgId || !pSel?.id || !date || !time) {
      showToast({ title: "Faltan datos", description: "Completa paciente, fecha y hora." });
      return;
    }
    setBusyCreate(true);
    try {
      const localStart = new Date(`${date}T${time}:00`);
      const body = {
        org_id: orgId,
        patient_id: pSel.id,
        title: title || "Consulta",
        notes: notes || undefined,
        start: localStart.toISOString(),
        duration_min: dur,
        attendee_email: (pSel as any).email || null,
      };
      const res = await fetch("/api/cal/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "No se pudo crear la cita");
      setOpenNew(false);
      showToast({
        title: "Cita creada",
        description:
          j.mode === "cal" ? "Se creó en Cal y en Sanoa." : "Se creó localmente en Sanoa.",
      });
      await load();
    } catch (e: any) {
      showToast({ title: "Error", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setBusyCreate(false);
    }
  }

  const unified: UniItem[] = useMemo(() => {
    const items: UniItem[] = [
      ...calItems.map((b) => ({
        kind: "cal" as const,
        uid: b.uid,
        title: b.title || "Cita",
        start: b.start,
        end: b.end,
        meetingUrl: b.meetingUrl,
        attendee: b.attendees?.[0]?.email,
      })),
      ...localItems.map((a) => ({
        kind: "local" as const,
        id: a.id,
        title: "Cita (local)",
        start: a.start_at,
        end: a.end_at || a.start_at,
        patient_id: a.patient_id,
        cal_event_id: a.cal_event_id ?? null,
      })),
    ];
    // sort estable: por fecha y en empate por título para que la key no "salte"
    return items.sort((x, y) => {
      const dx = +new Date(x.start) - +new Date(y.start);
      if (dx !== 0) return dx;
      const ax = "uid" in x ? x.uid : x.id;
      const ay = "uid" in y ? y.uid : y.id;
      return ax.localeCompare(ay);
    });
  }, [calItems, localItems]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
          <ColorEmoji token="agenda" />
          <span>Agenda</span>
        </h1>
        <div className="flex items-center gap-2">
          <a
            href={exportUrl || undefined}
            onClick={(e) => {
              if (!exportUrl) e.preventDefault();
            }}
            className={clsx(
              "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
              "bg-white/80 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900/80",
              !exportUrl && "pointer-events-none opacity-50"
            )}
            aria-disabled={!exportUrl}
            title={exportUrl ? "Exportar agenda en XLSX" : "Activa una organización para exportar"}
          >
            <span aria-hidden>📤</span>
            <span>Exportar</span>
          </a>
          <Button onClick={() => setOpenNew(true)} className="gap-2">
            <span aria-hidden>➕</span>
            <span>Agregar cita</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
        <select
          className="border rounded-md px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
        >
          <option value="upcoming">Próximas</option>
          <option value="past">Pasadas</option>
          <option value="accepted">Aceptadas</option>
          <option value="all">Todas</option>
        </select>
        <Input
          placeholder="Buscar por nombre o email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setQ("");
            setFrom("");
            setTo("");
            setStatus("upcoming");
          }}
        >
          Limpiar
        </Button>
        <Button type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Actualizando…" : "Actualizar"}
        </Button>
      </div>

      <div className="surface-light border rounded-xl divide-y bg-white/90 dark:bg-white/[0.06] backdrop-blur">
        {unified.length === 0 && (
          <div className="p-4 text-sm text-slate-700">
            {loading ? "Cargando…" : "Sin resultados."}
          </div>
        )}
        {unified.map((it) => {
          const key = it.kind === "cal" ? it.uid : it.id;
          const start = new Date(it.start);
          const end = new Date(it.end);
          return (
            <div key={key} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  {it.title}{" "}
                  {it.kind === "local" && !it.cal_event_id ? (
                    <span className="text-xs text-amber-600 align-middle">(local)</span>
                  ) : null}
                </div>
                <div className="text-sm text-slate-600">
                  {dtDateTime.format(start)} – {dtTime.format(end)}
                  {it.kind === "cal" && it.attendee ? ` · email: ${it.attendee}` : ""}
                </div>
                {"meetingUrl" in it && it.meetingUrl ? (
                  <div className="text-xs text-slate-500 break-all">{it.meetingUrl}</div>
                ) : null}
              </div>
              <div className="flex gap-2 shrink-0">
                {"meetingUrl" in it && it.meetingUrl && (
                  <a
                    className={clsx(
                      "inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm",
                      "bg-white/80 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900/80"
                    )}
                    href={it.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal NUEVA CITA */}
      <Modal open={openNew} onOpenChange={setOpenNew} title="Agregar cita">
        <div className="space-y-4">
          <div>
            <label className="text-sm block mb-1">Paciente</label>
            <Input
              placeholder="Buscar por nombre o email…"
              value={pQ}
              onChange={(e) => {
                setPQ(e.target.value);
                setPSel(null);
              }}
            />
            {pList.length > 0 && (
              <div className="mt-1 border rounded-md max-h-60 overflow-auto">
                {pList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b"
                    onClick={() => pickPatient(p)}
                  >
                    <div className="font-medium">
                      {(p as any).nombre || (p as any).full_name || "(sin nombre)"}
                    </div>
                    <div className="text-xs text-gray-600">{(p as any).email || "—"}</div>
                  </button>
                ))}
              </div>
            )}
            {pSel && (
              <div className="mt-1 text-xs text-green-700">
                Seleccionado: {(pSel as any).nombre || (pSel as any).full_name || pSel.id}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm block mb-1">Fecha</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm block mb-1">Hora</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm block mb-1">Duración (min)</label>
              <Input
                type="number"
                min={5}
                max={480}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value || 50))}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm block mb-1">Notas (opcional)</label>
            <textarea
              className="w-full border rounded-md p-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => void createAppt()}
              disabled={busyCreate || !pSel || !date || !time}
            >
              {busyCreate ? "Creando…" : "Crear cita"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

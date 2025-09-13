"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchBookings, type CalBooking } from "@/lib/cal";
import { listPatients, type Patient } from "@/lib/patients";
import { linkAppointmentToPatient } from "@/lib/appointments";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toaster";

type Status = "upcoming" | "past" | "accepted" | "all";

export default function AgendaPage() {
  const [status, setStatus] = useState<Status>("upcoming");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CalBooking[]>([]);
  const [openLink, setOpenLink] = useState<CalBooking | null>(null);

  // Búsqueda de pacientes al vincular
  const [patientQ, setPatientQ] = useState("");
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [patientPage, setPatientPage] = useState(1);

  const range = useMemo(() => {
    const afterStart = from ? new Date(from + "T00:00:00Z").toISOString() : undefined;
    const beforeEnd = to ? new Date(to + "T23:59:59Z").toISOString() : undefined;
    return { afterStart, beforeEnd };
  }, [from, to]);

  async function load() {
    setLoading(true);
    try {
      const bk = await fetchBookings({
        status: status === "all" ? undefined : status,
        q: q || undefined,
        ...range,
        take: 50,
      });
      setItems(bk);
    } catch (e: any) {
      showToast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, from, to]);

  async function searchPatients() {
    const res = await listPatients({ q: patientQ, page: patientPage, pageSize: 10, sortBy: "nombre", direction: "asc" });
    setPatientList(res.items);
  }

  useEffect(() => {
    if (openLink) void searchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openLink, patientQ, patientPage]);

  async function doLink(patientId: string) {
    if (!openLink) return;
    try {
      await linkAppointmentToPatient({
        patientId,
        calUid: openLink.uid,
        title: openLink.title,
        start: openLink.start,
        end: openLink.end,
        meetingUrl: openLink.meetingUrl,
        metadata: { hosts: openLink.hosts, attendees: openLink.attendees, eventTypeSlug: openLink.eventTypeSlug },
      });
      setOpenLink(null);
      showToast({ title: "Vinculado", description: "Cita vinculada al paciente." });
    } catch (e: any) {
      showToast({ title: "Error al vincular", description: e.message, variant: "destructive" });
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Agenda (Cal.com)</h1>

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
        <select className="border rounded-md px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="upcoming">Próximas</option>
          <option value="past">Pasadas</option>
          <option value="accepted">Aceptadas</option>
          <option value="all">Todas</option>
        </select>
        <Input placeholder="Buscar por nombre o email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Button variant="secondary" onClick={() => { setQ(""); setFrom(""); setTo(""); setStatus("upcoming"); }}>Limpiar</Button>
        <Button onClick={() => void load()} disabled={loading}>Actualizar</Button>
      </div>

      <div className="border rounded-xl divide-y bg-white">
        {items.length === 0 && <div className="p-4 text-sm text-gray-600">{loading ? "Cargando…" : "Sin resultados."}</div>}
        {items.map((b) => (
          <div key={b.uid} className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium">{b.title || "Cita"}</div>
              <div className="text-sm text-gray-600">
                {new Date(b.start).toLocaleString()} – {new Date(b.end).toLocaleTimeString()}
                {b.eventTypeSlug ? ` · tipo: ${b.eventTypeSlug}` : ""}
                {b.attendees?.[0]?.email ? ` · paciente/email: ${b.attendees[0].email}` : ""}
              </div>
              {b.meetingUrl && <div className="text-xs text-gray-500 break-all">{b.meetingUrl}</div>}
            </div>
            <div className="flex gap-2">
              {b.meetingUrl && (
                <Button variant="secondary" onClick={() => window.open(b.meetingUrl!, "_blank")}>Abrir</Button>
              )}
              <Button onClick={() => setOpenLink(b)}>Vincular a paciente</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!openLink} onOpenChange={() => setOpenLink(null)} title="Vincular a paciente">
        <div className="space-y-3">
          <Input placeholder="Buscar paciente por nombre…" value={patientQ} onChange={(e) => { setPatientQ(e.target.value); setPatientPage(1); }} />
          <div className="max-h-64 overflow-auto border rounded-md">
            {patientList.map((p) => (
              <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b" onClick={() => void doLink(p.id)}>
                <div className="font-medium">{p.nombre}</div>
                <div className="text-xs text-gray-600">Género: {p.genero} {p.edad ? `· ${p.edad} años` : ""}</div>
              </button>
            ))}
            {patientList.length === 0 && <div className="p-3 text-sm text-gray-600">Sin resultados…</div>}
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setPatientPage((x) => Math.max(1, x - 1))}>Anterior</Button>
            <Button variant="secondary" onClick={() => setPatientPage((x) => x + 1)}>Siguiente</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
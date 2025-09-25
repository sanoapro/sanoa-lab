// app/(app)/reportes/confirmaciones/page.tsx
'use client';

import { useEffect, useState } from 'react';
import AccentHeader from '@/components/ui/AccentHeader';

type Summary = {
  ok:boolean;
  tz:string;
  today:{ sent:number; delivered:number; failed:number; confirmed:number; cancelled:number };
  last7:{ sent:number; delivered:number; failed:number; confirmed:number; cancelled:number };
};

export default function ConfirmacionesReport(){
  const [orgId] = useState<string>(() => (typeof window!=='undefined' ? localStorage.getItem('org_id') || '' : ''));
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const r = await fetch(`/api/reports/confirmations/summary?org_id=${orgId}`);
        const j = await r.json();
        setData(j);
      } finally { setLoading(false); }
    })();
  }, [orgId]);

  const Card = ({ title, value, sub }:{ title:string; value:number; sub?:string }) => (
    <div className="border rounded p-4">
      <div className="text-xs opacity-70">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <AccentHeader emoji="📈">Confirmaciones</AccentHeader>
      {loading ? <div className="opacity-70 text-sm">Cargando…</div> : data ? (
        <>
          <section>
            <div className="text-sm font-medium mb-2">Hoy</div>
            <div className="grid md:grid-cols-5 gap-3">
              <Card title="Enviados" value={data.today.sent} />
              <Card title="Entregados" value={data.today.delivered} />
              <Card title="Fallidos" value={data.today.failed} />
              <Card title="Confirmados" value={data.today.confirmed} />
              <Card title="Cancelados" value={data.today.cancelled} />
            </div>
          </section>

          <section>
            <div className="text-sm font-medium mb-2">Últimos 7 días</div>
            <div className="grid md:grid-cols-5 gap-3">
              <Card title="Enviados" value={data.last7.sent} />
              <Card title="Entregados" value={data.last7.delivered} />
              <Card title="Fallidos" value={data.last7.failed} />
              <Card title="Confirmados" value={data.last7.confirmed} />
              <Card title="Cancelados" value={data.last7.cancelled} />
            </div>
          </section>

          <p className="text-xs opacity-70">
            Los datos provienen de <code>reminders</code> y <code>reminder_logs</code>. El conteo “Enviados” incluye entregados.
          </p>
        </>
      ) : <div className="opacity-70 text-sm">Sin datos.</div>}
    </div>
  );
}

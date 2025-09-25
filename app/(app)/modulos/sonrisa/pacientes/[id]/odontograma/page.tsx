'use client';

import { useEffect, useState } from 'react';
import AccentHeader from '@/components/ui/AccentHeader';
import CTAButton from '@/components/ui/CTAButton';
import Odontograma from '@/components/sonrisa/Odontograma';
import type { DentalChart } from '@/lib/sonrisa/types';

export default function OdontoPage({ params }:{ params:{ id:string } }){
  const [chart, setChart] = useState<DentalChart>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const r = await fetch(`/api/modules/sonrisa/odontograma/get-latest?patient_id=${params.id}`);
        const j = await r.json();
        if (j?.data?.chart) {
          setChart(j.data.chart);
          setRecordId(j.data.id);
        }
      }finally{ setLoading(false); }
    })();
  }, [params.id]);

  async function save(){
    const r = await fetch('/api/modules/sonrisa/odontograma/save', {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ id: recordId, patient_id: params.id, chart })
    });
    const j = await r.json();
    if (!r.ok) return alert(j?.error || 'Error al guardar');
    setRecordId(j.data?.id || null);
    alert('Odontograma guardado');
  }

  return (
    <div className="p-6 space-y-4">
      <AccentHeader emoji="😁">Odontograma</AccentHeader>
      {loading ? <div className="opacity-70 text-sm">Cargando…</div> : (
        <>
          <Odontograma initial={chart} onChange={setChart} />
          <div className="flex items-center gap-2">
            <CTAButton onClick={save}>Guardar</CTAButton>
            {recordId && (
              <a
                href={`/print/sonrisa/odontograma/${recordId}`}
                target="_blank" rel="noreferrer"
                className="text-sm underline"
              >
                Abrir versión para imprimir
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

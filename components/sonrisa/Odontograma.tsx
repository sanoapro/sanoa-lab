'use client';

import { useRef, useState } from 'react';
import type { DentalChart, ToothStatus } from '@/lib/sonrisa/types';
import html2canvas from 'html2canvas';

const statuses: ToothStatus[] = ['sano','caries','restaurado','ausente'];
const topRow  = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const bottomRow = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

function stClass(st: ToothStatus){
  switch (st) {
    case 'sano':        return 'bg-white';
    case 'caries':      return 'bg-red-200';
    case 'restaurado':  return 'bg-emerald-200';
    case 'ausente':     return 'bg-gray-300';
  }
}

export default function Odontograma({
  initial, onChange
}:{ initial?: DentalChart; onChange?: (c:DentalChart)=>void }){
  const [chart, setChart] = useState<DentalChart>(initial || {});
  const rootRef = useRef<HTMLDivElement>(null);

  function toggle(num: number){
    const key = String(num);
    const cur = chart[key]?.status || 'sano';
    const idx = statuses.indexOf(cur);
    const next = statuses[(idx + 1) % statuses.length];
    const nextChart = { ...chart, [key]: { status: next } };
    setChart(nextChart);
    onChange?.(nextChart);
  }

  async function exportPNG(){
    if (!rootRef.current) return;
    const canvas = await html2canvas(rootRef.current);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'odontograma.png';
    a.click();
  }

  return (
    <div className="space-y-4">
      <div ref={rootRef} className="space-y-3">
        {/* Fila superior */}
        <div className="grid [grid-template-columns:repeat(16,minmax(0,1fr))] gap-1">
          {topRow.map(n=>{
            const st = (chart[String(n)]?.status || 'sano') as ToothStatus;
            return (
              <button
                key={n}
                onClick={()=>toggle(n)}
                className={`aspect-square rounded text-[10px] flex items-center justify-center border transition ${stClass(st)}`}
                title={`Pieza ${n} — ${st}`}
              >
                {n}
              </button>
            );
          })}
        </div>
        {/* Fila inferior */}
        <div className="grid [grid-template-columns:repeat(16,minmax(0,1fr))] gap-1">
          {bottomRow.map(n=>{
            const st = (chart[String(n)]?.status || 'sano') as ToothStatus;
            return (
              <button
                key={n}
                onClick={()=>toggle(n)}
                className={`aspect-square rounded text-[10px] flex items-center justify-center border transition ${stClass(st)}`}
                title={`Pieza ${n} — ${st}`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={exportPNG} className="px-3 py-2 rounded bg-black text-white">Exportar PNG</button>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-block w-3 h-3 rounded border bg-white" /> sano
          <span className="inline-block w-3 h-3 rounded border bg-red-200" /> caries
          <span className="inline-block w-3 h-3 rounded border bg-emerald-200" /> restaurado
          <span className="inline-block w-3 h-3 rounded border bg-gray-300" /> ausente
        </div>
      </div>
    </div>
  );
}

'use client';
import Link from 'next/link';
import Gate from '@/components/Gate';
import AccentHeader from '@/components/ui/AccentHeader';

export default function EvaluacionesMente(){
  const orgId = typeof window !== 'undefined' ? localStorage.getItem('org_id') || '' : '';
  return (
    <div className="p-6 space-y-3">
      <AccentHeader emoji="🧠">Evaluaciones</AccentHeader>
      <Gate orgId={orgId} featureId="mente.evaluaciones" fallback={<div>No tienes habilitada la función de Evaluaciones.</div>}>
        <ul className="list-disc ml-6">
          <li><Link className="underline" href="/modulos/mente/pacientes/ID-DEMO/escalas/phq9">PHQ-9</Link> (demo)</li>
          <li><Link className="underline" href="/modulos/mente/pacientes/ID-DEMO/escalas/gad7">GAD-7</Link> (demo)</li>
        </ul>
      </Gate>
      <p className="text-xs opacity-70">Sustituye <code>ID-DEMO</code> por un <code>patient_id</code> real.</p>
    </div>
  );
}

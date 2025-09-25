// app/(app)/modulos/sonrisa/page.tsx (versión gated)
'use client';
import Link from 'next/link';
import AccentHeader from '@/components/ui/AccentHeader';
import Gate from '@/components/Gate';

export default function SonrisaHome(){
  const orgId = typeof window !== 'undefined' ? localStorage.getItem('org_id') || '' : '';
  return (
    <div className="p-6 space-y-4">
      <AccentHeader emoji="😁">Sonrisa</AccentHeader>
      <p className="opacity-80">Odontograma y herramientas de salud bucal.</p>
      <Gate orgId={orgId} featureId="sonrisa.odontograma" fallback={<div>Odontograma no habilitado para tu plan.</div>}>
        <ul className="list-disc ml-6">
          <li><Link className="underline" href="/modulos/sonrisa/pacientes/ID-DEMO/odontograma">Odontograma</Link> (demo)</li>
        </ul>
      </Gate>
      <p className="text-xs opacity-70">Sustituye <code>ID-DEMO</code> por un <code>patient_id</code> real.</p>
    </div>
  );
}

// app/(app)/modulos/equilibrio/pacientes/[id]/sesiones/new/page.tsx (envolver con Gate)
'use client';
import { useState } from 'react';
import Gate from '@/components/Gate';
import AccentHeader from '@/components/ui/AccentHeader';
import SOAPForm, { SOAPValue } from '@/components/equilibrio/SOAPForm';

export default function NewRehabSession({ params }:{ params:{ id:string } }){
  const [submitting, setSubmitting] = useState(false);
  const orgId = typeof window !== 'undefined' ? localStorage.getItem('org_id') || '' : '';

  async function handleSubmit(v: SOAPValue){ /* igual que arriba */ }

  return (
    <div className="p-6 space-y-4">
      <AccentHeader emoji="🧘">Nueva sesión (SOAP)</AccentHeader>
      <Gate orgId={orgId} featureId="equilibrio.sesion.soap" fallback={<div>Sesiones SOAP no habilitadas para tu plan.</div>}>
        <SOAPForm onSubmit={handleSubmit} submitting={submitting} />
      </Gate>
    </div>
  );
}

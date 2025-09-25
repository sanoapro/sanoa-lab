import Link from 'next/link';
import AccentHeader from '@/components/ui/AccentHeader';

export default function EquilibrioHome(){
  return (
    <div className="p-6 space-y-4">
      <AccentHeader emoji="🧘">Equilibrio</AccentHeader>
      <p className="opacity-80">Sesiones SOAP y plan de ejercicios.</p>
      <ul className="list-disc ml-6">
        <li><Link className="underline" href="/modulos/equilibrio/pacientes/ID-DEMO/sesiones">Sesiones del paciente</Link> (demo)</li>
        <li><Link className="underline" href="/modulos/equilibrio/pacientes/ID-DEMO/sesiones/new">Nueva sesión SOAP</Link> (demo)</li>
      </ul>
      <p className="text-xs opacity-70">Sustituye <code>ID-DEMO</code> por un <code>patient_id</code> real.</p>
    </div>
  );
}

import Link from 'next/link';
import AccentHeader from '@/components/ui/AccentHeader';

export default function MenteHome(){
  return (
    <div className="p-6 space-y-4">
      <AccentHeader emoji="🧠">Mente</AccentHeader>
      <p className="opacity-80">Evaluaciones clínicas (PHQ-9, GAD-7) y seguimiento.</p>
      <Link href="/modulos/mente/evaluaciones" className="underline">Ir a Evaluaciones</Link>
    </div>
  );
}

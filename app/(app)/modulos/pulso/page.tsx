import Link from 'next/link';
import AccentHeader from '@/components/ui/AccentHeader';

export default function PulsoHome(){
  return (
    <div className="p-6 space-y-4">
      <AccentHeader emoji="🩺">Pulso</AccentHeader>
      <p className="opacity-80">Calculadoras clínicas y herramientas para consulta general.</p>
      <Link href="/modulos/pulso/riesgo" className="underline">Riesgo cardiovascular</Link>
    </div>
  );
}

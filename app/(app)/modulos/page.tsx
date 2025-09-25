import ModuleCard from '@/components/ModuleCard';
import { NavModules } from '@/components/NavModules';
import AccentHeader from '@/components/ui/AccentHeader';

export default function ModulosPage(){
  return (
    <div className="p-6 space-y-6">
      <AccentHeader emoji="🧩">Módulos</AccentHeader>
      <NavModules />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ModuleCard title="🧠 Mente" desc="Escalas, notas y seguimiento." href="/modulos/mente" />
        <ModuleCard title="🩺 Pulso" desc="Calculadoras y herramientas de consulta." href="/modulos/pulso" />
        <ModuleCard title="😁 Sonrisa" desc="Odontograma, presupuestos, consentimientos." href="/modulos/sonrisa" />
        <ModuleCard title="🧘 Equilibrio" desc="Sesiones SOAP y planes de ejercicios." href="/modulos/equilibrio" />
      </div>
    </div>
  );
}

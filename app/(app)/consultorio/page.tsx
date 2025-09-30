import PatientAutocomplete from "@/components/patients/PatientAutocomplete";

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        <span className="emoji">🏥</span> Mi Consultorio
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Tu centro operativo: agenda, pacientes, recetas, laboratorio, recordatorios.
      </p>

      <div className="glass-card">
        <label className="block text-sm mb-2">Buscar paciente</label>
        <div className="relative">
          <PatientAutocomplete className="glass-input w-full relative z-10 pointer-events-auto" />
          {/* Evita overlays invisibles encima del input */}
        </div>
        <p className="mt-2 text-xs text-slate-500">Verás pacientes de tu organización activa.</p>
      </div>
    </div>
  );
}

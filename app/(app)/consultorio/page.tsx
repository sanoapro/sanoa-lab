// app/(app)/consultorio/page.tsx
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import OrgInspector from "@/components/shared/OrgInspector";

export const metadata = { title: "Mi Consultorio" };

export default function Page() {
  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="text-xl font-bold">Mi Consultorio</h1>
        <p className="text-sm text-muted-foreground">
          Tu centro operativo: agenda, pacientes, recetas, laboratorio y recordatorios.
        </p>
      </header>

      {/* Muestra instrucciones si no hay organización activa (OrgInspector hace el check internamente). */}
      <section>
        <OrgInspector
          title="Selecciona una organización activa para continuar."
          description="El buscador y el resto de herramientas se habilitan al elegir una organización en el switcher."
        />
      </section>

      {/* Buscador de pacientes (el propio componente puede manejar el estado sin org; si no, simplemente no arrojará resultados) */}
      <section className="space-y-2">
        <label className="text-sm font-medium" htmlFor="paciente-autocomplete">
          Buscar paciente
        </label>
        <PatientAutocomplete inputId="paciente-autocomplete" />
        <p className="text-xs text-muted-foreground">
          Solo se muestran pacientes de tu organización activa.
        </p>
      </section>
    </main>
  );
}

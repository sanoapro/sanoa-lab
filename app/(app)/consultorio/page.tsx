// app/(app)/consultorio/page.tsx
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import OrgInspector from "@/components/shared/OrgInspector";

export const metadata = { title: "Mi Consultorio" };

export default function Page() {
  // Si tuvieras un hook de organización, úsalo; aquí lo dejamos simple
  const hasOrg = true; // sustituye por tu estado real

  return (
    <main className="container py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Mi Consultorio</h1>
        <p className="text-sm text-muted-foreground">
          Tu centro operativo: agenda, pacientes, recetas, laboratorio, recordatorios.
        </p>
      </div>

      {!hasOrg ? (
        <OrgInspector />
      ) : (
        <section className="space-y-2">
          <label className="text-sm font-medium">Buscar paciente</label>
          <PatientAutocomplete />
          <p className="text-xs text-muted-foreground">
            Solo se muestran pacientes de tu organización.
          </p>
        </section>
      )}
    </main>
  );
}

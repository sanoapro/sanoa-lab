import TemplatePicker from "@/components/prescriptions/TemplatePicker";

export const metadata = { title: "Plantillas de Recetas" };

export default function Page() {
  return (
    <main className="container py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Plantillas</h1>
          <p className="text-sm text-muted-foreground">
            Crea y edita plantillas. Se guardan automáticamente.
          </p>
        </div>
      </div>

      <TemplatePicker />
    </main>
  );
}

import TemplatePicker from "@/components/prescriptions/TemplatePicker";

export const dynamic = "force-dynamic";

export default function TemplatesPage() {
  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">
        <span className="emoji">📚</span> Plantillas
      </h1>
      <div className="glass-card bubble">
        <TemplatePicker
          onSelect={(tpl) => {
            // Aquí puedes navegar al editor de receta, o inyectar en /prescriptions/create
            // Ejemplo simple:
            alert(`Usar plantilla: ${tpl.title}`);
          }}
        />
      </div>
    </main>
  );
}

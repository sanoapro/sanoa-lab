import TemplatePicker from "@/components/prescriptions/TemplatePicker";

export const metadata = { title: "Plantillas de receta" };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold"><span className="emoji">📝</span> Plantillas de receta</h1>
      <div className="glass-card bubble">
        <TemplatePicker />
      </div>
    </div>
  );
}

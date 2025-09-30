import TemplatePicker from "@/components/prescriptions/TemplatePicker";
import { RequireAuth } from "@/components/RequireAuth";

export default function Page() {
  return (
    <RequireAuth>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">
          <span className="emoji">🧾</span> Plantillas de recetas
        </h1>
        <div className="glass-card">
          <TemplatePicker />
        </div>
      </div>
    </RequireAuth>
  );
}

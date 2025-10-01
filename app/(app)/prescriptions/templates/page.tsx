import TemplatePicker from "@/components/prescriptions/TemplatePicker";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function RxTemplatesPage() {
  return (
    <main className="container py-6">
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="font-bold">Plantillas de Recetas</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplatePicker />
        </CardContent>
      </Card>
    </main>
  );
}

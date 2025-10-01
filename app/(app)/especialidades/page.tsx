import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const items = [
  { key: "mente", title: "Mente Pro", desc: "Evaluaciones, escalas y planes de apoyo." },
  { key: "pulso", title: "Pulso Pro", desc: "Indicadores clínicos, semáforos y riesgo CV." },
  { key: "equilibrio", title: "Equilibrio Pro", desc: "Planes de hábitos y seguimiento." },
  { key: "sonrisa", title: "Sonrisa Pro", desc: "Odontograma, presupuestos y firma." },
];

export default function Page() {
  return (
    <main className="container py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Especialidades</h1>
        <p className="text-sm text-muted-foreground">
          Especialidades con herramientas avanzadas. Desbloquea desde Sanoa Bank.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((it) => (
          <Card key={it.key} className="card-hover">
            <CardHeader>
              <CardTitle>{it.title}</CardTitle>
              <CardDescription>{it.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/modules/${it.key}/overview`}>Ver módulo</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/banco">Desbloquear con Sanoa Bank</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="text-[1rem] font-semibold">Suscripciones</h2>
        <ul className="text-sm text-muted-foreground grid gap-1">
          <li>🔹 Mente — activo / por activar</li>
          <li>🔹 Pulso — activo / por activar</li>
          <li>🔹 Sonrisa — activo / por activar</li>
          <li>🔹 Equilibrio — activo / por activar</li>
        </ul>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MODS = [
  { slug: "mente", title: "Mente", desc: "Evaluaciones, escalas y planes de apoyo." },
  { slug: "pulso", title: "Pulso", desc: "Indicadores clínicos, semáforos y riesgo CV." },
  { slug: "equilibrio", title: "Equilibrio", desc: "Planes de hábitos y seguimiento." },
  { slug: "sonrisa", title: "Sonrisa", desc: "Odontograma, presupuestos y firma." },
];

export default function EspecialidadesPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-semibold flex items-center gap-2" style={{ fontSize: "1.25rem" }}>
        <span className="emoji">🧩</span> Especialidades
      </h1>
      <p className="text-contrast/80" style={{ fontSize: "0.95rem" }}>
        Módulos profesionales con herramientas avanzadas.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {MODS.map((m) => (
          <Card key={m.slug} className="bubble">
            <CardHeader className="space-y-1">
              <CardTitle className="font-semibold" style={{ fontSize: "1.05rem" }}>
                {m.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-contrast/85" style={{ fontSize: "0.95rem" }}>
                {m.desc}
              </p>
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-2">
              <Button asChild variant="outline">
                <Link href={`/modulos/${m.slug}`}>Ver módulo</Link>
              </Button>
              <Button asChild variant="default">
                <Link href={`/banco/checkout?product=${m.slug}`}>Desbloquear</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

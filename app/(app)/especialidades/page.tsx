"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useModuleAccess } from "@/components/modules/useModuleAccess";

const MODS = [
  { slug: "mente", title: "Mente", desc: "Evaluaciones, escalas y planes de apoyo." },
  { slug: "pulso", title: "Pulso", desc: "Indicadores clínicos, semáforos y riesgo CV." },
  { slug: "equilibrio", title: "Equilibrio", desc: "Planes de hábitos y seguimiento." },
  { slug: "sonrisa", title: "Sonrisa", desc: "Odontograma, presupuestos y firma." },
] as const;

export default function EspecialidadesPage() {
  const { features, orgId } = useModuleAccess();

  return (
    <div className="space-y-4">
      <h1 className="font-semibold flex items-center gap-2 text-2xl">
        <span className="emoji">🧩</span> Especialidades
      </h1>
      <p className="text-contrast/80 text-sm">
        Módulos profesionales con herramientas avanzadas. Desbloquéalas desde <strong>Sanoa Bank</strong>.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {MODS.map((m) => {
          const active = !!features?.[m.slug as keyof typeof features];
          const checkoutUrl = orgId
            ? `/banco?checkout=${m.slug}&org_id=${orgId}`
            : `/banco?checkout=${m.slug}`;

          return (
            <Card key={m.slug} className="bubble">
              <CardHeader className="space-y-1">
                <CardTitle className="font-semibold text-[1.05rem]">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-contrast/85 text-[0.95rem]">{m.desc}</p>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2">
                <Button asChild variant="outline">
                  <Link href={`/modulos/${m.slug}`}>Ver módulo</Link>
                </Button>
                {active ? (
                  <Button asChild variant="default">
                    <Link href="/banco">Activo · Gestionar</Link>
                  </Button>
                ) : (
                  <Button asChild variant="default">
                    <Link href={checkoutUrl}>Desbloquear</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

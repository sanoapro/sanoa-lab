"use client";

// Conserva compatibilidad: export por defecto del inspector existente
export { default } from "@/components/organizations/ActiveOrgInspector";

import OrgSwitcherBadge from "@/components/OrgSwitcherBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Export nombrado opcional con la UI en tarjeta
export function OrgInspector({ ctaHref = "/ajustes" }: { ctaHref?: string }) {
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle>Selecciona una organización activa</CardTitle>
        <CardDescription>Elige o cambia tu organización para continuar.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <OrgSwitcherBadge />
        <Button asChild variant="primary">
          <a href={ctaHref}>Elegir organización</a>
        </Button>
      </CardContent>
    </Card>
  );
}

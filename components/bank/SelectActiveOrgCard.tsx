"use client";

import { useCallback } from "react";
import OrgSwitcherBadge from "@/components/OrgSwitcherBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SelectActiveOrgCard() {
  const handleChooseOrg = useCallback(() => {
    const target = document.querySelector<HTMLElement>("[data-org-switcher]");
    if (target) {
      target.dispatchEvent(new Event("click", { bubbles: true }));
      return;
    }

    window.location.assign("/ajustes");
  }, []);

  return (
    <Card className="max-w-lg">
      <CardHeader className="pb-4">
        <CardTitle>Selecciona una organización activa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Elige la organización activa para ver tus transacciones y reglas. Puedes cambiarla en cualquier momento.
        </p>
        <OrgSwitcherBadge variant="inline" />
      </CardContent>
      <CardFooter className="pt-4">
        <Button onClick={handleChooseOrg}>Elegir organización</Button>
      </CardFooter>
    </Card>
  );
}

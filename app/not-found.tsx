import Link from "next/link";

import Emoji from "@/components/Emoji";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Card className="mx-auto mt-12 max-w-xl space-y-4 text-center">
      <div className="text-6xl">
        <Emoji size={24}>🧭</Emoji>
      </div>
      <h1>Página no encontrada (404)</h1>
      <p className="text-muted-foreground">Uy… no pudimos encontrar lo que buscas.</p>
      <div className="flex justify-center gap-3 pt-2">
        <Button asChild variant="secondary">
          <Link href="/">
            <Emoji size={24} className="mr-1">🏠</Emoji>
            Inicio
          </Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <Emoji size={24} className="mr-1">📊</Emoji>
            Ir al dashboard
          </Link>
        </Button>
      </div>
    </Card>
  );
}

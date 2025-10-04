"use client";

import Link from "next/link";

import Emoji from "@/components/Emoji";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <Card className="mx-auto mt-12 max-w-xl space-y-4 text-center">
      <div className="text-6xl">
        <Emoji size={24}>🛠️</Emoji>
      </div>
      <h1>Algo no salió bien</h1>
      <p className="text-muted-foreground">{error?.message ?? "Error inesperado."}</p>
      <div className="flex justify-center gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => reset()}>
          <Emoji size={24} className="mr-1">🔁</Emoji>
          Reintentar
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <Emoji size={24} className="mr-1">📊</Emoji>
            Ir al tablero
          </Link>
        </Button>
      </div>
    </Card>
  );
}

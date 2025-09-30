"use client";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const areas = [
  { href: "/modulos/mente", emoji: "🧠", title: "Mente", desc: "Evaluaciones, sesiones, timeline" },
  { href: "/modulos/pulso", emoji: "💓", title: "Pulso", desc: "Signos, metas y seguimiento" },
  { href: "/modulos/equilibrio", emoji: "⚖️", title: "Equilibrio", desc: "Hábitos, planes y progreso" },
  { href: "/modulos/sonrisa", emoji: "😄", title: "Sonrisa", desc: "Odontograma, presupuestos" },
];

export default function AreasProPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-semibold mb-6">Áreas Pro</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {areas.map((a) => (
          <Card key={a.href} className="glass p-5 hover:scale-[1.01] transition">
            <div className="text-4xl mb-3">{a.emoji}</div>
            <h2 className="text-xl font-medium">{a.title}</h2>
            <p className="text-sm opacity-80 mb-4">{a.desc}</p>
            <div className="flex gap-2">
              <Link href={a.href} className="grow">
                <Button className="w-full glass-btn" type="button">
                  🚀 Abrir (Vista previa)
                </Button>
              </Link>
              <Link href={`/banco?sku=${encodeURIComponent("areas-pro.destacado")}`}>
                <Button variant="outline" className="glass-btn">💳 Desbloquear</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

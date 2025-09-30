// app/(app)/ajustes/page.tsx
"use client";

import * as React from "react";
import AccentHeader from "@/components/ui/AccentHeader";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";

export default function AjustesPage() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Ajustes"
        subtitle="Preferencias de cuenta y personalización."
        emojiToken="ajustes"
      />

      <section className="rounded-3xl bg-white/95 border p-6 space-y-4">
        <h3 className="font-semibold">Apariencia</h3>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-sm text-slate-600">Activa/desactiva modo oscuro.</span>
        </div>
      </section>

      <section className="rounded-3xl bg-white/95 border p-6 space-y-3">
        <h3 className="font-semibold">Cuenta</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Link href="/perfil" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border">
            <ColorEmoji token="perfil" /> Editar perfil
          </Link>
          <Link href="/banco" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border">
            <ColorEmoji token="banco" /> Pagos y suscripciones
          </Link>
          <Link href="/profesionales" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border">
            <ColorEmoji token="megafono" /> Ver perfil público
          </Link>
        </div>
      </section>
    </main>
  );
}

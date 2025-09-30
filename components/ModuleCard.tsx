"use client";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function ModuleCard({
  title,
  desc,
  href,
  locked,
}: {
  title: string;
  desc: string;
  href: string;
  locked?: boolean;
}) {
  return (
    <Card className="p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm opacity-70 mt-1">{desc}</p>
        </div>
        {locked && (
          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-white/10">Bloqueado</span>
        )}
      </div>
      <div className="mt-4">
        <Link
          className={`text-sm underline ${locked ? "pointer-events-none opacity-50" : ""}`}
          href={href}
        >
          {locked ? "Requiere suscripción" : "Abrir"}
        </Link>
      </div>
    </Card>
  );
}

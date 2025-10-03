"use client";

import * as React from "react";
import Link from "next/link";

export type TipAction = { href: string; label: string };
export type StarterTipsProps = {
  title?: string;
  tips: string[];
  actions?: TipAction[];
};

export default function StarterTips({ title = "Primeros pasos", tips, actions }: StarterTipsProps) {
  return (
    <section className="rounded-3xl border bg-white/95 p-6">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 list-disc pl-6 text-sm text-slate-700 dark:text-slate-300">
        {tips.map((t: any, i: any) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      {actions && actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((a: any) => (
            <Link key={a.href} href={a.href} className="px-3 py-2 rounded-xl border">
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

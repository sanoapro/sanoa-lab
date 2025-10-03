"use client";
import React from "react";
import { emojiTheme } from "@/config/emojiTheme";
import ColorEmoji from "@/components/ColorEmoji";

const FOCUS = ["recordatorios", "reportes", "banco", "plan"] as const;

export default function TestEmojiPage() {
  const tokens = Object.keys(emojiTheme).filter((k: any) => k !== "global");
  return (
    <main className="p-6 space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Test de emojis ({tokens.length})</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {tokens.map((t: any) => (
            <div key={t} className="flex items-center gap-3 rounded-xl border p-3">
              <ColorEmoji token={t} size={22} />
              <code className="text-sm">{t}</code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Focus tokens</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FOCUS.map((t: any) => {
            const repr = (emojiTheme as any)[t];
            const kind = repr?.startsWith?.("svg:")
              ? "svg"
              : repr?.startsWith?.("lucide:")
                ? "lucide"
                : "text";
            return (
              <div key={t} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <ColorEmoji token={t} size={24} />
                  <strong>{t}</strong>
                </div>
                <div className="text-xs text-slate-500">
                  <div>
                    repr: <code>{String(repr)}</code>
                  </div>
                  <div>
                    kind: <code>{kind}</code>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

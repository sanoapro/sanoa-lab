"use client";

import Emoji from "@/components/Emoji";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useToast } from "./Toast";

export { showToast } from "./Toast";

export default function Toaster() {
  const { toasts, remove } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast: any) => {
        const variant = toast.variant === "error" ? "error" : toast.variant === "success" ? "success" : "default";
        const emoji = variant === "success" ? "✅" : variant === "error" ? "⚠️" : "🔔";

        return (
          <Card key={toast.id} className="min-w-[260px] flex items-start gap-3 bg-background/90 shadow-card backdrop-blur">
            <div className="text-2xl">
              <Emoji size="lg">{emoji}</Emoji>
            </div>
            <div className="flex-1 space-y-1">
              {toast.title && <div className="font-semibold text-sm uppercase tracking-wide text-muted-foreground/70">{toast.title}</div>}
              {toast.description && <div className="text-sm text-muted-foreground">{toast.description}</div>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-muted"
              onClick={() => remove(toast.id)}
              aria-label="Cerrar"
            >
              ✖️
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

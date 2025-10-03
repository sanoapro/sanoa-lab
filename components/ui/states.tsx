"use client";

export function TableLoader() {
  return (
    <div className="space-y-2">
      <div className="skeleton h-10 w-full" />
      {[...Array(6)].map((_: any, i: any) => (
        <div key={i} className="skeleton h-10 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title = "Sin datos", hint = "Ajusta filtros o intenta más tarde." }: { title?: string; hint?: string }) {
  return (
    <div className="text-center py-10 text-muted-foreground">
      <div className="text-2xl mb-2">🗂️</div>
      <div className="font-medium">{title}</div>
      <div className="text-sm">{hint}</div>
    </div>
  );
}

export function ErrorState({ message = "Ocurrió un error" }: { message?: string }) {
  return (
    <div className="text-center py-10 text-red-600 dark:text-red-400">
      <div className="text-2xl mb-2">⚠️</div>
      <div className="font-medium">{message}</div>
    </div>
  );
}

// components/ui/empty-state.tsx
import { Button } from "@/components/ui/button";

export function EmptyState({
  title = "Sin resultados",
  description = "Intenta ajustar los filtros o crear un nuevo elemento.",
  action,
}: {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void } | null;
}) {
  return (
    <div className="text-center py-16 border border-dashed border-border rounded-xl">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      {action && (
        <div className="mt-4">
          <Button onClick={action.onClick} variant="primary">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

// app/(app)/banco/reglas/page.tsx

import OrgInspector from "@/components/shared/OrgInspector";
import RulesEditor from "@/components/bank/RulesEditor";

export const metadata = { title: "Banco · Reglas" };

export default function Page() {
  return (
    <main className="container py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Banco · Reglas</h1>
        <p className="text-sm text-muted-foreground">
          Crea y ajusta reglas de categorización. Se aplican a futuras transacciones.
        </p>
      </div>

      <OrgInspector>
        <section className="rounded-lg border border-border bg-card p-4">
          <RulesEditor />
        </section>
      </OrgInspector>
    </main>
  );
}

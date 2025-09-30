"use client";

import { useMemo } from "react";
import OrgSwitcherBadge from "@/components/OrgSwitcherBadge";
import RulesEditor from "@/components/bank/RulesEditor";
import { getActiveOrg } from "@/lib/org-local";

export default function BankRulesPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id ?? "";

  if (!orgId) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">
          <span className="emoji">🏦</span> Banco · Reglas
        </h1>
        <div className="glass-card space-y-3">
          <p>Selecciona una organización activa para continuar.</p>
          <OrgSwitcherBadge />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">
        <span className="emoji">🧩</span> Banco · Reglas
      </h1>
      <div className="glass-card">
        <RulesEditor />
      </div>
    </div>
  );
}

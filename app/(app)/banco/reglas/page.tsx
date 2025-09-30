"use client";

import { useMemo } from "react";
import { getActiveOrg } from "@/lib/org-local";
import RulesEditor from "@/components/bank/RulesEditor";
import OrgSelectorHint from "@/components/bank/OrgSelectorHint";

export default function BankRulesPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Banco · Reglas</h1>
      {!orgId && (
        <div className="mb-4">
          <OrgSelectorHint />
        </div>
      )}
      {orgId && <RulesEditor />}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { getActiveOrg } from "@/lib/org-local";
import RulesEditor from "@/components/bank/RulesEditor";
import ColorEmoji from "@/components/ColorEmoji";
import ActiveOrgSelectorCard from "@/components/org/ActiveOrgSelectorCard";

export default function BankRulesPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-3 flex items-center gap-2">
        <ColorEmoji token="banco" size={18} /> Banco · Reglas
      </h1>
      {!orgId ? <ActiveOrgSelectorCard /> : <div className="mt-4"><RulesEditor /></div>}
    </div>
  );
}

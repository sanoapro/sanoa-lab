"use client";

import { useEffect, useState } from "react";
import { createOrganization, listMyOrganizations, listMembers, type Organization, type OrgMember, setMemberRole } from "@/lib/org";
import { getActiveOrg, setActiveOrg } from "@/lib/org-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/Toaster";

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [members, setMembers] = useState<Record<string, OrgMember[]>>({});
  const [name, setName] = useState("");
  const active = getActiveOrg();

  async function load() {
    const list = await listMyOrganizations();
    setOrgs(list);
    const obj: Record<string, OrgMember[]> = {};
    for (const o of list) {
      try { obj[o.id] = await listMembers(o.id); } catch { obj[o.id] = []; }
    }
    setMembers(obj);
  }

  useEffect(() => { void load(); }, []);

  async function create() {
    if (!name.trim()) { showToast({ title: "Valida", description: "Nombre requerido." }); return; }
    const o = await createOrganization(name.trim());
    setName("");
    await load();
    setActiveOrg(o.id, o.name);
    showToast({ title: "Creada", description: "Organización creada y activada." });
  }

  function activate(o: Organization) {
    setActiveOrg(o.id, o.name);
    showToast({ title: "Activada", description: `Org activa: ${o.name}` });
  }

  async function updateRole(orgId: string, userId: string, role: "owner" | "admin" | "member") {
    await setMemberRole(orgId, userId, role);
    await load();
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Organizaciones</h1>

      <div className="border rounded-xl p-4 bg-white space-y-3">
        <div className="font-medium">Crear organización</div>
        <div className="flex gap-2">
          <Input placeholder="Nombre de la organización" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={() => void create()}>Crear</Button>
        </div>
      </div>

      <div className="border rounded-xl divide-y bg-white">
        {orgs.length === 0 && <div className="p-4 text-sm text-gray-600">Aún no tienes organizaciones.</div>}
        {orgs.map((o) => (
          <div key={o.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">{o.name} <span className="text-xs text-gray-500">({o.id.slice(0,8)}…)</span></div>
              <div className="flex gap-2">
                <Button variant={active.id === o.id ? "secondary" : "default"} onClick={() => activate(o)}>
                  {active.id === o.id ? "Activa" : "Activar"}
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-600">Miembros</div>
            <div className="rounded-md border">
              {(members[o.id] ?? []).map(m => (
                <div key={m.user_id} className="p-2 flex items-center justify-between border-b last:border-b-0">
                  <div className="text-sm">{m.user_id} · rol: <strong>{m.role}</strong></div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => void updateRole(o.id, m.user_id, "member")}>Member</Button>
                    <Button variant="secondary" onClick={() => void updateRole(o.id, m.user_id, "admin")}>Admin</Button>
                  </div>
                </div>
              ))}
              {(members[o.id] ?? []).length === 0 && <div className="p-2 text-sm text-gray-600">Sin miembros visibles.</div>}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">Tip: La “organización activa” se usa para asignar org_id al crear pacientes y para filtrar la lista cuando elijas esa opción.</p>
    </div>
  );
}
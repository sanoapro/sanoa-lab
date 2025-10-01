export default function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`badge ${active ? "badge-active" : "badge-inactive"}`}>
      <span className="emoji">{active ? "🟢" : "🔒"}</span>
      {active ? "Activo" : "Por activar"}
    </span>
  );
}

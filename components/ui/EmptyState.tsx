export default function EmptyState({
  emoji = "✨",
  title = "Nada por aquí",
  hint = "Aún no hay datos para mostrar.",
  ctaText,
  onCta,
}: {
  emoji?: string;
  title?: string;
  hint?: string;
  ctaText?: string;
  onCta?: () => void;
}) {
  return (
    <div className="glass-card bubble text-center py-10 space-y-2">
      <div className="text-4xl">
        <span className="emoji">{emoji}</span>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-contrast/80">{hint}</p>
      {ctaText && onCta && (
        <div className="pt-2">
          <button className="glass-btn" onClick={onCta}>
            <span className="emoji">➕</span> {ctaText}
          </button>
        </div>
      )}
    </div>
  );
}

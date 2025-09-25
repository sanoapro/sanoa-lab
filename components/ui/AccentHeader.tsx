export default function AccentHeader({
  children,
  emoji,
}: {
  children: React.ReactNode;
  emoji?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {emoji ? (
        <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
          <span className="text-xl">{emoji}</span>
        </span>
      ) : null}
      <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-text)]">
        {children}
      </h2>
    </div>
  );
}

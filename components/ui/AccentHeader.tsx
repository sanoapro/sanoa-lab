import ColorEmoji from "@/components/ColorEmoji";
import type { ReactNode } from "react";

type AccentHeaderProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  emojiToken?: string;
  emoji?: string;
  children?: ReactNode;
};

export default function AccentHeader({
  title,
  subtitle,
  emojiToken,
  emoji,
  children,
}: AccentHeaderProps) {
  const heading = title ?? children ?? null;

  return (
    <header className="space-y-1">
      <div className="flex items-center gap-3">
        {emojiToken || emoji ? (
          <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
            <ColorEmoji token={emojiToken} emoji={emoji} size={22} aria-hidden />
          </span>
        ) : null}
        <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-text)]">
          {heading}
        </h2>
      </div>
      {subtitle ? (
        <p className="text-sm text-[var(--color-brand-text)]/70">{subtitle}</p>
      ) : null}
      {!title && children && heading !== children ? (
        <div className="text-sm text-[var(--color-brand-text)]/70">{children}</div>
      ) : null}
    </header>
  );
}

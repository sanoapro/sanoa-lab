import Link from "next/link";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ModuleCardProps = {
  title: ReactNode;
  description?: ReactNode;
  ctas?: { label: string; href: string }[];
  className?: string;
  children?: ReactNode;
};

export default function ModuleCard({ title, description, ctas, className, children }: ModuleCardProps) {
  return (
    <div
      className={cn(
        "glass relative overflow-hidden rounded-2xl border border-white/20 px-5 py-6 shadow-lg transition hover:shadow-xl",
        "bg-white/60 dark:bg-slate-900/60",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          {description ? (
            <div className="text-sm text-slate-600 dark:text-slate-200/80">{description}</div>
          ) : null}
        </div>

        {children}

        {ctas && ctas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {ctas.map((cta) => (
              <Link
                key={cta.href}
                href={cta.href}
                className="glass-btn inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-white/70 dark:text-slate-100 dark:hover:bg-slate-950/55"
              >
                <span className="emoji" aria-hidden>
                  🔗
                </span>
                {cta.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

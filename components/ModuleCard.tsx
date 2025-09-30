import Link from "next/link";

import { cn } from "@/lib/utils";

type ModuleCardProps = {
  title: string;
  description?: string;
  ctas?: { label: string; href: string }[];
  className?: string;
};

export default function ModuleCard({ title, description, ctas, className }: ModuleCardProps) {
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
            <p className="text-sm text-slate-600 dark:text-slate-200/80">{description}</p>
          ) : null}
        </div>

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

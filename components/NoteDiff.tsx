"use client";
import { diffWords } from "diff";

export default function NoteDiff(props: { before: string; after: string }) {
  const parts = diffWords(props.before || "", props.after || "");
  return (
    <div className="prose max-w-none text-sm">
      {parts.map((p, i) => {
        if (p.added)
          return (
            <mark key={i} className="bg-green-100 text-green-800 rounded px-0.5">
              {p.value}
            </mark>
          );
        if (p.removed)
          return (
            <mark key={i} className="bg-red-100 text-red-800 line-through rounded px-0.5">
              {p.value}
            </mark>
          );
        return <span key={i}>{p.value}</span>;
      })}
    </div>
  );
}

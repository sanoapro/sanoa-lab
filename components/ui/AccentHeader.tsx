'use client';
import { PropsWithChildren } from 'react';

export default function AccentHeader({ children, emoji }: PropsWithChildren<{ emoji?: string }>) {
  return (
    <div className="mb-4">
      <div className="h-1 w-full bg-gradient-to-r from-[#D97A66] via-[#f2b9ac] to-transparent rounded" />
      <h1 className="mt-3 text-2xl font-bold flex items-center gap-2">
        {emoji && <span aria-hidden>{emoji}</span>}
        <span>{children}</span>
      </h1>
    </div>
  );
}

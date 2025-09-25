'use client';
import Link from 'next/link';

export function NavModules(){
  return (
    <nav className="flex gap-4 text-sm">
      <Link href="/modulos/mente" className="underline">🧠 Mente</Link>
      <Link href="/modulos/pulso" className="underline">🩺 Pulso</Link>
      <Link href="/modulos/sonrisa" className="underline">😁 Sonrisa</Link>
      <Link href="/modulos/equilibrio" className="underline">🧘 Equilibrio</Link>
    </nav>
  );
}

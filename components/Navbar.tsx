// components/Navbar.tsx
"use client";

import DensityToggle from "./DensityToggle";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 glass-card bubble nav-lg !rounded-2xl mx-2 mt-2">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="emoji" aria-hidden>
            ✨
          </span>
          <span className="font-semibold">Sanoa</span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* agrega aquí otros botones si los necesitas */}
          <DensityToggle />
        </div>
      </div>
    </nav>
  );
}

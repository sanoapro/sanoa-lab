"use client";

import DensityToggle from "./DensityToggle";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 glass-card bubble nav-lg !rounded-2xl mx-2 mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="emoji">✨</span>
          <span className="font-semibold">Sanoa</span>
        </div>
        <div className="flex items-center gap-2">
          {/* ...tus otros botones */}
          <DensityToggle />
        </div>
      </div>
    </nav>
  );
}

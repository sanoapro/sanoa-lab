"use client";
import React, { useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  // Aplica densidad persistente
  useEffect(() => {
    const d = (localStorage.getItem("ui:density") as "compact"|"comfortable"|null) ?? "comfortable";
    document.documentElement.setAttribute("data-density", d);
  }, []);

  return (
    <div className="min-h-dvh">
      <Navbar />
      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-3 p-3">
        <Sidebar />
        <main className="space-y-3">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";

export default function DensityToggle(){
  const [d, setD] = useState<"compact"|"comfortable">("comfortable");

  useEffect(() => {
    const stored = (localStorage.getItem("ui:density") as any) || "comfortable";
    setD(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-density", d);
    localStorage.setItem("ui:density", d);
  }, [d]);

  return (
    <button className="glass-btn" onClick={() => setD(d === "comfortable" ? "compact" : "comfortable")}>
      <span className="emoji">{d === "comfortable" ? "🫧" : "📏"}</span>
      {d === "comfortable" ? "Cómoda" : "Compacta"}
    </button>
  );
}

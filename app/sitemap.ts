import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const now = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "", "login", "dashboard", "reset-password", "update-password", "offline",
    "pacientes", "perfil", "test-ui/upload",
  ];
  return paths.map((p) => ({
    url: `${base}/${p}`.replace(/\/+$/, "/"),
    lastModified: now,
    changeFrequency: "monthly",
    priority: p === "" || p === "dashboard" ? 0.8 : 0.5,
  }));
}

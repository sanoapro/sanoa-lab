import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sanoa Lab",
    short_name: "Sanoa",
    description: "PWA modular para ecosistema clínico (LatAm).",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#FBF3E5",
    theme_color: "#D97A66",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}

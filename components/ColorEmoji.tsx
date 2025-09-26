"use client";

import * as React from "react";
import clsx from "clsx";
import { emojiTheme, EMOJI_FALLBACK_TOKEN, type EmojiToken } from "@/config/emojiTheme";

/** Aliases y fallbacks locales para evitar “default” cuando el tema no tenga la clave. */
const TOKEN_ALIASES: Record<string, string> = {
  // Navegación
  dashboard: "tablero",
  modulos: "carpeta",
  reportes: "lucide:BarChart3",
  banco: "lucide:Banknote",
  plan: "lucide:Compass",

  // Suites / especialidades
  mente: "lucide:Brain",
  pulso: "lucide:Activity",
  sonrisa: "lucide:Smile",
  equilibrio: "lucide:Scale",
};

function LazyLucideIcon({
  name,
  size,
  className,
}: {
  name: string;
  size: number;
  className?: string;
}) {
  const [Comp, setComp] = React.useState<React.ComponentType<any> | null>(null);

  React.useEffect(() => {
    let alive = true;
    import("lucide-react").then((mod: any) => {
      if (!alive) return;
      const C = mod?.[name];
      setComp(() => (typeof C === "function" ? C : null));
      if (!C && process.env.NODE_ENV !== "production") {
        console.warn(`[ColorEmoji] Icono lucide "${name}" no encontrado.`);
      }
    });
    return () => {
      alive = false;
    };
  }, [name]);

  if (!Comp) {
    return (
      <span
        className={clsx("inline-block align-[-0.125em]", className)}
        style={{ width: size, height: size, lineHeight: 0 }}
        aria-hidden="true"
      />
    );
  }
  return <Comp size={size} className={className} aria-hidden="true" />;
}

function resolveToken(token?: string): { kind: "svg" | "lucide" | "text"; value: string } {
  // Aplica alias (si el alias es lucide/svg, lo detectamos abajo)
  const alias = token ? TOKEN_ALIASES[token] : undefined;

  // Si el alias NO es una directiva lucide/svg, úsalo como clave de theme; si no, deja la original
  const themeKey =
    alias && !alias.startsWith("lucide:") && !alias.startsWith("svg:") ? alias : token;

  const v = themeKey && (emojiTheme as Record<string, string>)[themeKey];

  if (!v && token && process.env.NODE_ENV !== "production") {
    console.warn(`[ColorEmoji] Token no encontrado en theme: "${token}".`);
  }

  // Si no está en el theme pero el alias apunta directo a lucide/svg, úsalo.
  if (!v && alias?.startsWith("lucide:")) {
    return { kind: "lucide", value: alias.substring(7) };
  }
  if (!v && alias?.startsWith("svg:")) {
    return { kind: "svg", value: `/${alias.substring(4)}.svg` };
  }

  const value = (v ?? emojiTheme[EMOJI_FALLBACK_TOKEN]) as string;

  if (value.startsWith("svg:")) return { kind: "svg", value: `/${value.substring(4)}.svg` };
  if (value.startsWith("lucide:")) return { kind: "lucide", value: value.substring(7) };
  return { kind: "text", value };
}

export type ColorEmojiProps = {
  token?: EmojiToken | string;
  emoji?: string; // override puntual
  size?: number;
  title?: string;
  className?: string;
  mode?: "native" | "mono" | "duotone"; // opcional
  role?: React.AriaRole;
  "aria-hidden"?: boolean;
  "aria-label"?: string;
};

export default function ColorEmoji({
  token,
  emoji,
  size = 18,
  title,
  className,
  mode,
  role = "img",
  ...a11y
}: ColorEmojiProps) {
  const resolved = emoji ? { kind: "text" as const, value: emoji } : resolveToken(token);
  const extra = mode === "mono" ? "grayscale" : mode === "duotone" ? "" : "";

  if (resolved.kind === "svg") {
    return (
      <img
        src={resolved.value}
        width={size}
        height={size}
        alt={a11y["aria-label"] ?? title ?? (typeof token === "string" ? token : "icono")}
        title={title}
        className={clsx("inline-block select-none align-[-0.125em]", extra, className)}
        aria-hidden={a11y["aria-hidden"]}
        role={role}
      />
    );
  }

  if (resolved.kind === "lucide") {
    return (
      <span
        role={role}
        title={title}
        aria-hidden={a11y["aria-hidden"]}
        aria-label={a11y["aria-label"]}
        className={clsx("inline-flex items-center justify-center", extra, className)}
        style={{ width: size, height: size, lineHeight: 0 }}
      >
        <LazyLucideIcon name={resolved.value} size={size} />
      </span>
    );
  }

  return (
    <span
      role={role}
      title={title}
      aria-hidden={a11y["aria-hidden"]}
      aria-label={a11y["aria-label"]}
      className={clsx("inline-block select-none leading-none align-[-0.125em]", extra, className)}
      style={{ fontSize: size, width: size, height: size }}
    >
      {resolved.value}
    </span>
  );
}

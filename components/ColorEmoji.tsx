/* eslint-disable prefer-const */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getEmojiChar, getEmojiSettings } from "@/config/emojiTheme";

/* ================= util color ================= */

function parseCssColorToRgb(color: string, ctx: HTMLElement) {
  const el = document.createElement("span");
  el.style.color = color;
  ctx.appendChild(el);
  const rgb = getComputedStyle(el).color; // "rgb(217, 122, 102)"
  ctx.removeChild(el);
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: +m[1], g: +m[2], b: +m[3] };
}
function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, l };
}
function hslToRgb({ h, s, l }: { h: number; s: number; l: number }) {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}
function rgbToCss({ r, g, b }: { r: number; g: number; b: number }) {
  return `rgb(${r}, ${g}, ${b})`;
}
function lightenOrDarken(rgb: { r: number; g: number; b: number }, deltaL = 0.22) {
  const hsl = rgbToHsl(rgb);
  const l = hsl.l > 0.5 ? Math.max(0, hsl.l - deltaL) : Math.min(1, hsl.l + deltaL);
  const { r, g, b } = hslToRgb({ ...hsl, l });
  return rgbToCss({ r, g, b });
}

/* ================= util svg ================= */

function toCodePoints(emoji: string) {
  const cps: string[] = [];
  for (const sym of Array.from(emoji)) {
    const cp = sym.codePointAt(0);
    if (cp !== undefined) cps.push(cp.toString(16));
  }
  return cps.join("-");
}

type Mode = "mono" | "duotone" | "native";
type Props = {
  /** Usa un nombre semántico del mapa (email, globo, etc.) o pasa emoji directamente con `emoji` */
  token?: string;
  emoji?: string;
  size?: number;
  /** Override opcional: si lo pasas, ignoras el tema */
  mode?: Mode;
  color?: string;
  accentColor?: string;
  title?: string;
  className?: string;
};

export default function ColorEmoji({
  token,
  emoji,
  size = 22,
  mode,
  color,
  accentColor,
  title,
  className = "",
}: Props) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [svg, setSvg] = useState<string | null>(null);

  // 1) Resolver el carácter y los estilos desde el tema
  const char = useMemo(() => getEmojiChar(token ?? emoji ?? ""), [token, emoji]);
  const theme = getEmojiSettings(char);
  const effMode: Mode = (mode ?? theme.mode) as Mode;
  const baseColor = color ?? theme.color;
  const accent = accentColor ?? theme.accentColor;

  // 2) Nativo = renderizar el emoji del sistema (sin SVG)
  if (effMode === "native") {
    return (
      <span
        ref={hostRef}
        className={`inline-flex items-center justify-center align-[-0.125em] ${className}`}
        style={{ width: size, height: size, fontSize: size, lineHeight: 1 }}
        aria-label={title}
        title={title}
      >
        {char}
      </span>
    );
  }

  // 3) Modo mono/duotone con Twemoji SVG
  const code = useMemo(() => toCodePoints(char), [char]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!hostRef.current) return;
      try {
        const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`;
        const raw = await (await fetch(url)).text();
        if (cancelled) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(raw, "image/svg+xml");
        const svgEl = doc.querySelector("svg");
        if (!svgEl) return;

        svgEl.setAttribute("role", "img");
        if (title) svgEl.setAttribute("aria-label", title);
        else svgEl.setAttribute("aria-hidden", "true");
        svgEl.setAttribute("style", "display:block;width:1em;height:1em");

        const baseRgb = parseCssColorToRgb(baseColor, hostRef.current);
        const baseCss = rgbToCss(baseRgb);
        const accentCss = accent ?? lightenOrDarken(baseRgb, 0.22);

        const shapes = Array.from(
          svgEl.querySelectorAll<SVGGraphicsElement>(
            "path, circle, rect, ellipse, polygon, polyline, g",
          ),
        )
          .map((el) => ({
            el,
            weight: (el as any).getAttribute?.("d")?.length ?? JSON.stringify(el.outerHTML).length,
          }))
          .sort((a, b) => b.weight - a.weight);

        const setFS = (el: Element, fill: string, stroke: string) => {
          const f = el.getAttribute("fill");
          if (f && f !== "none") el.setAttribute("fill", fill);
          const s = el.getAttribute("stroke");
          if (s && s !== "none") el.setAttribute("stroke", stroke);
        };

        if (effMode === "mono") {
          shapes.forEach(({ el }) => setFS(el, baseCss, baseCss));
        } else {
          // duotone
          shapes.forEach(({ el }, i) => {
            const main = i === 0;
            setFS(el, main ? baseCss : accentCss, main ? baseCss : accentCss);
          });
          // Candado/llave con contraste extra
          const specials = ["1f511", "1f510", "1f512"];
          if (specials.includes(code)) {
            const last = shapes.at(-1)?.el;
            if (last) setFS(last, accentCss, accentCss);
          }
        }

        setSvg(svgEl.outerHTML);
      } catch {
        setSvg(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [code, effMode, baseColor, accent, title]);

  return (
    <span
      ref={hostRef}
      className={`inline-flex items-center justify-center align-[-0.125em] ${className}`}
      style={{ width: size, height: size, fontSize: size, lineHeight: 1 }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      title={title}
    >
      {!svg ? char : null}
    </span>
  );
}

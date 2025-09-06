"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ========= utilidades de color ========= */

function parseCssColorToRgb(color: string, ctx: HTMLElement) {
  // Resuelve var(--foo) / nombres como "red" / hex / rgb(a)
  const el = document.createElement("span");
  el.style.color = color;
  ctx.appendChild(el);
  const rgb = getComputedStyle(el).color; // ej. "rgb(217, 122, 102)"
  ctx.removeChild(el);

  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: +m[1], g: +m[2], b: +m[3] };
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
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
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function rgbToCss({ r, g, b }: { r: number; g: number; b: number }) {
  return `rgb(${r}, ${g}, ${b})`;
}

function lightenOrDarken(rgb: { r: number; g: number; b: number }, deltaL = 0.18) {
  const hsl = rgbToHsl(rgb);
  // si es claro, oscurece; si es oscuro, aclara
  const l = hsl.l > 0.5 ? Math.max(0, hsl.l - deltaL) : Math.min(1, hsl.l + deltaL);
  return rgbToCss(hslToRgb({ ...hsl, l }));
}

/* ========= utilidades de SVG ========= */

function toCodePoints(emoji: string) {
  const codePoints: string[] = [];
  for (const symbol of Array.from(emoji)) {
    const codePoint = symbol.codePointAt(0);
    if (codePoint !== undefined) codePoints.push(codePoint.toString(16));
  }
  return codePoints.join("-");
}

type Mode = "auto" | "mono" | "duotone" | "native";

type Props = {
  emoji: string;                 // p.ej. "🔐"
  size?: number;                 // px
  color?: string;                // color base (default: var(--color-brand-primary))
  accentColor?: string;          // deja que calculemos una si no se pasa
  mode?: Mode;                   // 'auto' (default), 'mono', 'duotone', 'native'
  title?: string;
  className?: string;
};

export default function ColorEmoji({
  emoji,
  size = 22,
  color = "var(--color-brand-primary)",
  accentColor,
  mode = "auto",
  title,
  className = "",
}: Props) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [svg, setSvg] = useState<string | null>(null);

  const code = useMemo(() => toCodePoints(emoji), [emoji]);

  useEffect(() => {
    const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`;
    fetch(url)
      .then((r) => r.text())
      .then((raw) => {
        if (!hostRef.current) return;

        // 1) parsear
        const parser = new DOMParser();
        const doc = parser.parseFromString(raw, "image/svg+xml");
        const svgEl = doc.querySelector("svg");
        if (!svgEl) return;

        // 2) estilos base
        svgEl.setAttribute("role", "img");
        if (title) svgEl.setAttribute("aria-label", title);
        else svgEl.setAttribute("aria-hidden", "true");
        svgEl.setAttribute("style", "display:block;width:1em;height:1em");

        if (mode === "native") {
          setSvg(svgEl.outerHTML);
          return;
        }

        // 3) calcular colores reales
        const baseRgb = parseCssColorToRgb(color, hostRef.current);
        const baseCss = rgbToCss(baseRgb);
        const accentCss =
          accentColor ??
          lightenOrDarken(baseRgb, 0.22); // genera un segundo tono con buen contraste

        // 4) seleccionar nodos con relleno (paths, shapes)
        const shapes = Array.from(
          svgEl.querySelectorAll<SVGGraphicsElement>(
            "path, circle, rect, ellipse, polygon, polyline, g"
          )
        );

        // Heurística duotono:
        // - medimos "complejidad" por longitud del atributo 'd' (si existe)
        // - el más grande queda con color base, el resto con acento
        const sorted = shapes
          .map((el) => ({
            el,
            weight:
              (el as any).getAttribute?.("d")?.length ??
              JSON.stringify(el.outerHTML).length,
          }))
          .sort((a, b) => b.weight - a.weight);

        const setFillStroke = (el: Element, fill: string, stroke: string) => {
          // No pisamos "none"
          const f = el.getAttribute("fill");
          if (f && f !== "none") el.setAttribute("fill", fill);
          const s = el.getAttribute("stroke");
          if (s && s !== "none") el.setAttribute("stroke", stroke);
        };

        const effectiveMode: Mode = mode === "auto" ? "duotone" : mode;

        if (effectiveMode === "mono") {
          sorted.forEach(({ el }) => setFillStroke(el, baseCss, baseCss));
        } else if (effectiveMode === "duotone") {
          sorted.forEach(({ el }, i) => {
            const isMain = i === 0; // la pieza más grande
            setFillStroke(el, isMain ? baseCss : accentCss, isMain ? baseCss : accentCss);
          });

          // Algunos emojis (key/lock) ganan contraste extra
          const special = ["1f511", "1f510", "1f512"]; // key, lock with key, lock
          if (special.includes(code)) {
            // Forzamos último elemento como acento para resaltar detalles
            const last = sorted.at(-1)?.el;
            if (last) setFillStroke(last, accentCss, accentCss);
          }
        }

        setSvg(svgEl.outerHTML);
      })
      .catch(() => setSvg(null));
  }, [code, color, accentColor, mode, title]);

  return (
    <span
      ref={hostRef}
      className={`inline-flex items-center justify-center align-[-0.125em] ${className}`}
      style={{ width: size, height: size, fontSize: size }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      title={title}
    >
      {!svg ? emoji : null}
    </span>
  );
}

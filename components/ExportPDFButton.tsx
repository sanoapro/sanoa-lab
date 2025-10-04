"use client";

import React, { useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";
import { showToast } from "@/components/Toaster";
import { Button } from "@/components/ui/button";

type Props = {
  /** Referencia al nodo raíz a exportar */
  targetRef?: React.RefObject<HTMLElement | null>;
  /** Alternativa: id del elemento si no usas ref */
  targetId?: string;
  /** Nombre de archivo (compatibilidad) */
  filename?: string; // ej: "Paciente-Juan Perez.pdf"
  /** Nombre de archivo (alias nuevo) */
  fileName?: string; // ej: "Paciente-Juan-2025-09-12-1530.pdf"
  /** Clase extra para el botón (versión simple) */
  className?: string;
  /** Texto del botón */
  label?: string;
  /** Escala de render (por defecto 2; se limita para no generar PDFs gigantes) */
  scale?: number;
  /** Si true, renderiza el botón de shadcn/ui en lugar del <button> con ColorEmoji */
  useUiButton?: boolean;
  /** Deshabilitar el botón externamente (opcional) */
  disabled?: boolean;
};

export default function ExportPDFButton({
  targetRef,
  targetId,
  filename = "export.pdf",
  fileName,
  className = "",
  label = "Exportar PDF",
  scale = 2,
  useUiButton = false,
  disabled = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const isDisabled = disabled || busy;

  async function handleExport() {
    const el =
      targetRef?.current ||
      (targetId ? (document.getElementById(targetId) as HTMLElement | null) : null);

    if (!el) {
      try {
        showToast({
          title: "Error",
          description: "No se encontró la sección a exportar.",
          variant: "destructive",
        });
      } catch {
        alert("No se encontró la sección a exportar.");
      }
      return;
    }

    setBusy(true);
    try {
      // Cede dos frames para estabilizar layout antes de capturar
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      // Lazy import (mejor chunking que import estático)
      const html2canvasMod = await import("html2canvas");
      const html2canvas = (html2canvasMod as any).default ?? html2canvasMod;

      const jsPDFMod = await import("jspdf");
      const JsPDFCtor = (jsPDFMod as any).default ?? (jsPDFMod as any).jsPDF;

      // Limita escala para evitar archivos pesados
      const effScale = Math.min(scale || 2, 2.5);

      // Captura TODO el contenido del contenedor (aunque tenga scroll)
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: effScale,
        useCORS: true,
        logging: false,
        windowWidth: el.scrollWidth || undefined,
        windowHeight: el.scrollHeight || undefined,
        // Ignora elementos marcados para no renderizar, útil para botones/acciones
        ignoreElements: (node: Element) =>
          node instanceof HTMLElement && node.getAttribute("data-html2canvas-ignore") === "true",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new JsPDFCtor({ orientation: "p", unit: "mm", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      let heightLeft = imgH;
      let position = 0;

      // Primera página
      pdf.addImage(imgData, "PNG", 0, position, imgW, imgH, undefined, "FAST");
      heightLeft -= pageH;

      // Paginado: re-coloca la misma imagen desplazada hacia arriba
      while (heightLeft > 0) {
        pdf.addPage();
        position = -(imgH - heightLeft);
        pdf.addImage(imgData, "PNG", 0, position, imgW, imgH, undefined, "FAST");
        heightLeft -= pageH;
      }

      const outName = fileName || filename || "export.pdf";
      pdf.save(outName);
    } catch (err: any) {
      console.error(err);
      try {
        showToast({
          title: "No se pudo exportar",
          description: err?.message || "Ocurrió un error durante la exportación.",
          variant: "destructive",
        });
      } catch {
        alert(err?.message || "No se pudo exportar el PDF.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (useUiButton) {
    return (
      <Button onClick={() => void handleExport()} disabled={isDisabled} variant="secondary">
        {busy ? "Exportando…" : label}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleExport()}
      disabled={isDisabled}
      className={`inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)] disabled:opacity-60 ${className}`}
      title="Exportar a PDF"
      aria-busy={busy}
      data-html2canvas-ignore="true"
    >
      <ColorEmoji token="exportar" size={16} />
      {busy ? "Exportando…" : label}
    </button>
  );
}

"use client";
import { useState } from "react";
import ColorEmoji from "@/components/ColorEmoji";

type Props = {
  targetRef?: React.RefObject<HTMLElement | HTMLDivElement | null>;
  targetId?: string; // alternativa si no usas ref
  filename?: string; // ej: "Paciente-Juan Perez.pdf"
  className?: string;
  label?: string; // texto del botón
};

export default function ExportPDFButton({
  targetRef,
  targetId,
  filename = "export.pdf",
  className = "",
  label = "Exportar PDF",
}: Props) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const el =
        targetRef?.current ||
        (targetId ? (document.getElementById(targetId) as HTMLElement | null) : null);
      if (!el) throw new Error("No se encontró el contenedor a exportar.");

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Renderizamos a canvas con buena resolución
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: Math.min(window.devicePixelRatio || 1.5, 2), // límite para peso
        useCORS: true,
        // ignora nodos marcados con data-html2canvas-ignore
        ignoreElements: (node) =>
          node instanceof HTMLElement && node.getAttribute("data-html2canvas-ignore") === "true",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      // Calculamos tamaño manteniendo proporción
      const imgW = pdfW;
      const imgH = (canvas.height * imgW) / canvas.width;

      let heightLeft = imgH;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
      heightLeft -= pdfH;

      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
        heightLeft -= pdfH;
      }

      pdf.save(filename);
    } catch (err: unknown) {
      console.error(
        err instanceof Error
          ? err
          : (() => {
              try {
                return JSON.stringify(err);
              } catch {
                return String(err);
              }
            })(),
      );
      alert((err as any)?.message || "No se pudo exportar el PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)] disabled:opacity-60 ${className}`}
      title="Exportar a PDF"
    >
      <ColorEmoji token="exportar" size={16} />
      {busy ? "Exportando…" : label}
    </button>
  );
}

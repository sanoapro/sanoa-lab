"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Tesseract from "tesseract.js";
import { showToast } from "@/components/Toaster";

type Result = {
  id: string;
  request_id: string;
  patient_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  reviewed_at: string | null;
};

export default function LabRequestDetailPage() {
  const { id: patientId, req: requestId } = useParams<{ id: string; req: string }>();
  const [items, setItems] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [ocrBusy, setOcrBusy] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    try {
      const j = await fetch(`/api/lab/results/list?request_id=${requestId}`).then((r: any) => r.json());
      setItems(j.results || []);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load(); /* eslint-disable-next-line */
  }, [requestId]);

  async function getSignedUrl(path: string): Promise<string> {
    // Reusamos tu endpoint existente de archivos firmados
    const r = await fetch(`/api/files/signed?path=${encodeURIComponent(path)}`);
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "No se pudo obtener URL firmada");
    return j.url as string;
  }

  async function review(id: string) {
    const r = await fetch("/api/lab/results/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result_id: id }),
    });
    const j = await r.json();
    if (!r.ok) {
      showToast({ title: "Error", description: j.error, variant: "destructive" });
      return;
    }
    showToast({ title: "Revisado", description: "Marcado como revisado." });
    await load();
  }

  async function runOCR(res: Result) {
    setOcrBusy(res.id);
    setOcrText(null);
    try {
      if (!res.mime_type || !res.mime_type.startsWith("image/")) {
        showToast({
          title: "OCR",
          description: "El OCR rápido funciona para imágenes (PNG/JPG). Para PDF lo veremos luego.",
          variant: "secondary",
        });
        return;
      }
      const url = await getSignedUrl(res.file_path);
      const blob = await fetch(url).then((r: any) => r.blob());
      const {
        data: { text },
      } = await Tesseract.recognize(await blob.arrayBuffer(), "spa");
      setOcrText(text.trim());
      showToast({ title: "OCR listo", description: "Texto extraído." });
    } catch (e: any) {
      showToast({ title: "OCR falló", description: e.message, variant: "destructive" });
    } finally {
      setOcrBusy(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Resultados del laboratorio</h1>

      <div className="border rounded-xl bg-white dark:bg-slate-900 divide-y">
        {items.length === 0 && (
          <div className="p-4 text-sm text-slate-600 dark:text-slate-300">
            {busy ? "Cargando…" : "Sin resultados."}
          </div>
        )}
        {items.map((r: any) => (
          <div key={r.id} className="p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium">{r.file_name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {new Date(r.created_at).toLocaleString()} ·{" "}
                  {r.size_bytes ? `${(r.size_bytes / 1024).toFixed(1)} KB` : ""} ·{" "}
                  {r.reviewed_at ? "Revisado" : "Pendiente"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const u = await getSignedUrl(r.file_path);
                    window.open(u, "_blank");
                  }}
                  className="px-3 py-1.5"
                >
                  Ver
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const u = await getSignedUrl(r.file_path);
                    const a = document.createElement("a");
                    a.href = u;
                    a.download = r.file_name;
                    a.click();
                  }}
                  className="px-3 py-1.5"
                >
                  Descargar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void runOCR(r)}
                  disabled={!!ocrBusy}
                  className="px-3 py-1.5"
                >
                  {ocrBusy === r.id ? "OCR…" : "OCR rápido"}
                </Button>
                <Button
                  onClick={() => void review(r.id)}
                  disabled={!!r.reviewed_at}
                  className="px-3 py-1.5"
                >
                  Marcar revisado
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {ocrText && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-sm font-medium mb-2">Texto OCR</div>
          <pre className="text-xs whitespace-pre-wrap break-words">{ocrText}</pre>
        </div>
      )}
    </div>
  );
}

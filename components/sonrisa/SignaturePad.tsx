// components/sonrisa/SignaturePad.tsx
"use client";
import { useEffect, useRef, useState } from "react";

export default function SignaturePad({
  onChange,
  width = 600,
  height = 200,
}: {
  onChange?: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  function pos(e: React.MouseEvent | React.TouchEvent) {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    const touch = "touches" in e ? e.touches[0] : (e as any);
    return { x: touch.clientX - r.left, y: touch.clientY - r.top };
  }

  function start(e: any) {
    setDrawing(true);
  }
  function end() {
    setDrawing(false);
    const c = ref.current!;
    onChange?.(c.toDataURL("image/png"));
  }
  function move(e: any) {
    if (!drawing) return;
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  function clear() {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    onChange?.(null);
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={ref}
        width={width}
        height={height}
        className="border rounded-xl w-full touch-none bg-white"
        onMouseDown={start}
        onMouseUp={end}
        onMouseMove={move}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchEnd={end}
        onTouchMove={move}
      />
      <div className="flex gap-2">
        <button className="border rounded px-3 py-2" onClick={clear}>
          Limpiar
        </button>
      </div>
    </div>
  );
}

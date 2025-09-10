"use client";
export default function UploadHint() {
  const max = process.env.NEXT_PUBLIC_UPLOAD_MAX_MB ?? "10";
  const types = process.env.NEXT_PUBLIC_UPLOAD_ALLOWED ?? "pdf,jpg,png";
  return (
    <p className="text-xs text-[var(--color-brand-bluegray)]">
      Máx. {max} MB · Tipos: {types}
    </p>
  );
}

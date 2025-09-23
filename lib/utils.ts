import { type ClassValue } from "clsx";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind classnames merge */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Lanza Error con string (no objetos), útil para Next/Turbopack */
export async function assertOk(res: Response): Promise<Response> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const t = await res.text();
      if (t) msg = t;
    } catch {}
    throw new Error(msg);
  }
  return res;
}

/** Fetch que devuelve JSON y normaliza errores a Error(string) */
export async function fetchJSON<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const r = await fetch(input, init);
  await assertOk(r);
  return r.json() as Promise<T>;
}

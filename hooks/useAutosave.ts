"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type SaveFn<T> = (_data: T) => Promise<T | void>;

export function useAutosave<T>(initial: T, saveFn: SaveFn<T>, delay = 800) {
  const [data, setData] = useState<T>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // React 19: requiere valor inicial explícito
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setData(initial);
    setStatus("idle");
  }, [initial]);

  const flush = useCallback(async () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    try {
      setStatus("saving");
      const result = await saveFn(data);
      if (result) {
        setData(result);
      }
      setStatus("saved");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }, [data, saveFn]);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      void flush();
    }, delay);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [data, flush, delay]);

  return { data, setData, status, flush };
}

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type ToastVariant = "default" | "success" | "error" | "info";

type ToastInput = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

type Toast = ToastInput & { id: string };

type ToastContextValue = {
  show: (_toast: ToastInput) => void;
  toast: (_toast: ToastInput) => void;
  remove: (_id: string) => void;
  toasts: Toast[];
};

const ToastContext = createContext<ToastContextValue | null>(null);

let externalShow: ((_toast: ToastInput) => void) | null = null;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    externalShow = show;
    return () => {
      externalShow = null;
    };
  }, [show]);

  const value: ToastContextValue = {
    show,
    toast: show,
    remove,
    toasts,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de <ToastProvider />");
  }
  return context;
}

export function useToastSafe(): ToastContextValue {
  const context = useContext(ToastContext);
  return (
    context ?? {
      show: () => {},
      toast: () => {},
      remove: () => {},
      toasts: [],
    }
  );
}

type ShowToastArg =
  | string
  | ({
      title?: string;
      description?: string;
      variant?: "success" | "error" | "info" | "destructive" | "default";
    } & Record<string, unknown>);

type ShowToastKind = "success" | "error" | "info";

export function showToast(arg: ShowToastArg, kind?: ShowToastKind) {
  if (!externalShow) {
    throw new Error("showToast requiere que el árbol esté envuelto por <ToastProvider />");
  }

  if (typeof arg === "string") {
    externalShow({ description: arg, variant: kind ?? "default" });
    return;
  }

  const mappedVariant =
    arg.variant === "destructive" ? "error" : (arg.variant ?? "default");

  externalShow({
    title: arg.title,
    description: arg.description,
    variant: mappedVariant,
  });
}

export type { Toast, ToastInput, ToastVariant, ToastContextValue };

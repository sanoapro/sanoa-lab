"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/Toast";
import RegisterSW from "@/components/RegisterSW";
import Toaster from "@/components/Toaster";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <RegisterSW />
        <Toaster />
      </ThemeProvider>
    </ToastProvider>
  );
}

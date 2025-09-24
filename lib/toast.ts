import { showToast } from "@/components/Toaster";

type Opts = { title: string; description?: string };

export const toast = {
  success: ({ title, description }: Opts) =>
    showToast({ title, description, variant: "success" as const }),
  error: ({ title, description }: Opts) =>
    showToast({ title, description, variant: "error" as const }),
  info: ({ title, description }: Opts) =>
    showToast({ title, description, variant: "default" as const }),
};

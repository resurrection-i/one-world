import { create } from "zustand";
import type { ToastState } from "@/types";

interface AppState {
  toast: ToastState | null;
  showToast: (toast: Omit<ToastState, "id">) => void;
  hideToast: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  toast: null,

  showToast: (toast) =>
    set(() => ({
      toast: { ...toast, id: crypto.randomUUID() },
    })),

  hideToast: () => set({ toast: null }),
}));

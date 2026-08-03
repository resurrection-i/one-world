import { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

export function Toast() {
  const { toast, hideToast } = useAppStore();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => hideToast(), toast.duration ?? 2500);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  const Icon =
    toast.type === "success" ? CheckCircle : toast.type === "error" ? AlertCircle : Info;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] toast-enter sm:bottom-6 sm:left-auto sm:right-6">
      <div
        className={cn(
          "mx-auto flex w-full max-w-md items-center gap-3 rounded-xl border px-4 py-3 shadow-xl sm:mx-0",
          toast.type === "success" && "border-[#FFD700]/30 bg-white text-[#B8860B]",
          toast.type === "error" && "border-[#FF6B6B]/30 bg-white text-[#FF6B6B]",
          toast.type === "info" && "border-[#00B4D8]/30 bg-white text-[#00B4D8]"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1 break-words text-sm font-medium text-[#0F172A]">
          {toast.message}
        </span>
        <button
          onClick={hideToast}
          className="ml-2 shrink-0 text-[#94A3B8] transition-colors hover:text-[#0F172A]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

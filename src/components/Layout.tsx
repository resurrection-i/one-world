import type { ReactNode } from "react";
import { Header } from "./Header";
import { Toast } from "./Toast";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-[#F8FAFC] text-[#334155]">
      <Header />
      <main className="flex-1 page-fade-in">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:p-6 lg:p-8">{children}</div>
      </main>
      <Toast />
    </div>
  );
}

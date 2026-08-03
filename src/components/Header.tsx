import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Rocket,
  Gamepad2,
  Wallet,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";

const navItems = [
  { to: "/", icon: Home, label: "首页" },
  { to: "/mint", icon: Rocket, label: "Mint发射" },
  { to: "/game", icon: Gamepad2, label: "游戏" },
];

export function Header() {
  const wallet = useWallet();
  const { showToast } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (wallet.error) showToast({ type: "error", message: wallet.error });
  }, [showToast, wallet.error]);

  const displayNetwork =
    wallet.chainId === 56
      ? "BNB Smart Chain"
      : wallet.chainId === 1
        ? "Ethereum"
        : wallet.chainId === 42161
          ? "Arbitrum One"
          : wallet.chainId === 8453
            ? "Base"
            : wallet.chainId
              ? `Chain ${wallet.chainId}`
              : "";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#25282C] bg-[#0A0B0D]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 lg:px-6">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/one-world-logo.jpg"
              alt="一个世界"
              className="h-9 w-9 rounded-xl object-cover ring-1 ring-[#FFD700]/30"
            />
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold leading-tight text-white">一个世界</h1>
              <p className="text-[10px] font-medium tracking-wide text-[#6B7280]">ONE WORLD</p>
            </div>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-[#FFD700]"
                      : "text-[#9CA3AF] hover:bg-[#1A1D21] hover:text-white"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-[13px] left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#FFD700]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right side status & wallet */}
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="hidden md:flex items-center gap-3 text-xs text-[#6B7280]">
              <span>v1.0</span>
              <span className="flex items-center gap-1.5 rounded-full border border-[#25282C] bg-[#111215] px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
                ONLINE
              </span>
            </div>

            {!wallet.isConnected ? (
              <button
                onClick={wallet.connectWallet}
                disabled={wallet.loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#B8860B] px-4 py-2 text-sm font-semibold text-black transition-all hover:brightness-110 hover:scale-[1.02] disabled:opacity-50"
              >
                {wallet.loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">连接钱包</span>
                <span className="sm:hidden">连接</span>
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-[#25282C] bg-[#111215] px-3 py-2 text-sm text-white transition-all hover:border-[#FFD700]/30 hover:bg-[#1A1D21]"
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      wallet.isBSC ? "bg-[#FFD700]" : "bg-[#FF6B6B]"
                    )}
                  />
                  <span className="hidden sm:inline">
                    {wallet.account?.slice(0, 6)}...{wallet.account?.slice(-4)}
                  </span>
                  <span className="sm:hidden">
                    {wallet.account?.slice(0, 4)}...{wallet.account?.slice(-2)}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-[#9CA3AF] transition-transform", dropdownOpen && "rotate-180")} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-[#25282C] bg-[#111215] p-3 shadow-xl">
                    <div className="mb-3 space-y-2 border-b border-[#25282C] pb-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">地址</span>
                        <span className="font-mono text-white">{wallet.account?.slice(0, 10)}...{wallet.account?.slice(-8)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">网络</span>
                        <span className={wallet.isBSC ? "text-[#FFD700]" : "text-[#FF6B6B]"}>
                          {displayNetwork || "未知网络"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        wallet.disconnectWallet();
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25282C] bg-[#0A0B0D] py-2 text-xs text-[#9CA3AF] transition-colors hover:border-[#FFD700]/30 hover:text-white"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      断开连接
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden rounded-xl p-2 text-[#9CA3AF] transition-colors hover:bg-[#1A1D21] hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay nav */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-80 flex-col border-l border-[#25282C] bg-[#111215]">
            <div className="flex items-center justify-between border-b border-[#25282C] px-5 py-4">
              <div className="flex items-center gap-3">
                <img
                  src="/one-world-logo.jpg"
                  alt="一个世界"
                  className="h-8 w-8 rounded-xl object-cover ring-1 ring-[#FFD700]/30"
                />
                <div>
                  <h1 className="text-sm font-bold text-white">一个世界</h1>
                  <p className="text-[10px] text-[#6B7280]">ONE WORLD</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-[#9CA3AF] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[#FFD700]/10 text-[#FFD700]"
                            : "text-[#9CA3AF] hover:bg-[#1A1D21] hover:text-white"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-[#25282C] p-4">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>v1.0</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
                  ONLINE
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

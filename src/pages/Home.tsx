import { useNavigate } from "react-router-dom";
import { Rocket, Gamepad2, Sparkles, Globe, Users, Coins } from "lucide-react";

const highlights = [
  {
    icon: Globe,
    title: "开放世界",
    description: "在一个无缝连接的虚拟星球中探索、建造与互动。",
  },
  {
    icon: Users,
    title: "社区共治",
    description: "由玩家与持币者共同参与的世界规则与生态决策。",
  },
  {
    icon: Coins,
    title: "链上资产",
    description: "游戏内资产通过发射台铸造，真正属于你。",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page-fade-in flex min-h-[calc(100vh-8rem)] flex-col gap-8 lg:gap-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC]">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[#00B4D8]/10 blur-[120px]" />
          <div className="absolute -right-20 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[#FFD700]/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDIxNSwwLDAuMDUpIi8+PC9zdmc+')] opacity-30" />
        </div>

        <div className="relative flex flex-col items-center px-6 py-16 text-center lg:py-24">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-[#FFD700]/20 blur-3xl" />
            <img
              src="/one-world-logo.jpg"
              alt="一个世界"
              className="relative h-32 w-32 rounded-3xl object-cover shadow-2xl shadow-[#00B4D8]/20 ring-2 ring-[#FFD700]/30 lg:h-40 lg:w-40"
            />
            <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#FFD700] text-[#0F172A]">
              <Sparkles className="h-4 w-4 text-[#0F172A]" />
            </span>
          </div>

          <h1 className="bg-gradient-to-r from-[#FFD700] via-[#FFE55C] to-[#00B4D8] bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            一个世界
          </h1>
          <p className="mt-2 text-lg font-medium text-[#00B4D8] sm:text-xl">
            One World
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#64748B] sm:text-lg">
            创造你的世界，铸造你的未来。在链上开启属于你的文明、经济与冒险。
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate("/mint")}
              className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFD700] to-[#B8860B] px-8 py-3.5 text-base font-bold text-black shadow-[0_0_24px_rgba(255,215,0,0.25)] transition-all hover:shadow-[0_0_32px_rgba(255,215,0,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              <Rocket className="relative h-5 w-5" />
              <span className="relative">立即 Mint</span>
            </button>
            <button
              onClick={() => navigate("/game")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-8 py-3.5 text-base font-semibold text-[#0F172A] transition-all hover:border-[#00B4D8]/50 hover:bg-[#F1F5F9] hover:shadow-[0_0_24px_rgba(0,180,216,0.12)] active:scale-[0.98]"
            >
              <Gamepad2 className="h-5 w-5 text-[#00B4D8]" />
              进入游戏
            </button>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">世界特色</h2>
            <p className="text-xs text-[#94A3B8]">FEATURES</p>
          </div>
          <div className="flex-1 border-t border-[#E2E8F0]" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="world-card group text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#00B4D8]/30 hover:bg-[#F1F5F9] hover:shadow-[0_0_20px_rgba(0,180,216,0.08)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8FAFC] transition-colors group-hover:bg-[#E2E8F0]">
                <item.icon className="h-5 w-5 text-[#FFD700]" />
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-[#0F172A] group-hover:text-[#00B4D8]">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#64748B]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-auto rounded-2xl border border-[#E2E8F0] bg-white/80 p-6 lg:p-8">
        <div className="flex flex-col items-center justify-between gap-4 text-center lg:flex-row lg:text-left">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">准备好打造你的世界了吗？</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              连接钱包，发射你的专属代币，然后进入游戏开始创造。
            </p>
          </div>
          <button
            onClick={() => navigate("/mint")}
            className="world-btn-primary shrink-0"
          >
            <Rocket className="h-4 w-4" />
            开始 Mint 发射
          </button>
        </div>
      </section>
    </div>
  );
}

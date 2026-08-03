import { useEffect, useRef, useState } from "react";
import { Gamepad2, Loader2, Play, Info, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";

/**
 * 游戏页面
 *
 * 说明：
 * 1. 本地 Cocos Creator 项目需要先构建为 web-mobile：
 *    在 Cocos Creator 中选择 "项目 -> 构建发布 -> Web Mobile"，
 *    构建完成后会在项目目录生成 build/web-mobile。
 * 2. 将 build/web-mobile 的内容复制到本项目的 public/game-web-mobile/ 目录下，
 *    然后刷新页面即可。
 * 3. 游戏内如需调用钱包，可以通过 window.parent.postMessage 向本页面发送消息，
 *    本页面会监听并调用 useWallet 提供的能力，再通过 postMessage 回传结果。
 */
const GAME_SRC = "/game-web-mobile/index.html";

const postMessageToGame = (target: HTMLIFrameElement | null, payload: unknown) => {
  if (!target?.contentWindow) return;
  target.contentWindow.postMessage(payload, "*");
};

export default function Game() {
  const wallet = useWallet();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [srcAvailable, setSrcAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [iframeError, setIframeError] = useState("");

  // 预检游戏资源是否存在，避免 Vite SPA fallback 导致递归嵌套。
  // 通过请求 Cocos 构建产物中的标志性 CSS 文件并校验 content-type 来判断。
  useEffect(() => {
    let cancelled = false;
    fetch("/game-web-mobile/style-mobile.css")
      .then((res) => {
        if (cancelled) return;
        const type = res.headers.get("content-type") || "";
        setSrcAvailable(res.ok && type.includes("text/css"));
      })
      .catch(() => {
        if (cancelled) return;
        setSrcAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 监听游戏内发来的钱包请求，并通过 postMessage 回传结果
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const { data } = event;
      if (!data || typeof data !== "object") return;
      const { type, id, payload } = data as { type?: string; id?: string; payload?: unknown };
      if (!type || !id) return;

      switch (type) {
        case "WALLET_CONNECT_RESPONSE":
        case "WALLET_SIGN_MESSAGE_RESPONSE":
        case "WALLET_GET_STATE_RESPONSE":
          // 这些是本页面发给游戏的消息，忽略
          break;
        case "WALLET_CONNECT": {
          try {
            await wallet.connectWallet();
            postMessageToGame(iframeRef.current, {
              id,
              type: "WALLET_CONNECT_RESPONSE",
              payload: {
                ok: wallet.isConnected,
                account: wallet.account,
                chainId: wallet.chainId,
                balance: wallet.balance,
              },
            });
          } catch (error) {
            postMessageToGame(iframeRef.current, {
              id,
              type: "WALLET_CONNECT_RESPONSE",
              payload: { ok: false, error: error instanceof Error ? error.message : "连接失败" },
            });
          }
          break;
        }
        case "WALLET_GET_STATE": {
          postMessageToGame(iframeRef.current, {
            id,
            type: "WALLET_GET_STATE_RESPONSE",
            payload: {
              ok: true,
              account: wallet.account,
              chainId: wallet.chainId,
              isConnected: wallet.isConnected,
              isBSC: wallet.isBSC,
              balance: wallet.balance,
            },
          });
          break;
        }
        case "WALLET_SIGN_MESSAGE": {
          if (!wallet.signer) {
            postMessageToGame(iframeRef.current, {
              id,
              type: "WALLET_SIGN_MESSAGE_RESPONSE",
              payload: { ok: false, error: "钱包未连接" },
            });
            return;
          }
          try {
            const message = String((payload as { message?: string })?.message ?? "");
            const signature = await wallet.signer.signMessage(message);
            postMessageToGame(iframeRef.current, {
              id,
              type: "WALLET_SIGN_MESSAGE_RESPONSE",
              payload: { ok: true, signature },
            });
          } catch (error) {
            postMessageToGame(iframeRef.current, {
              id,
              type: "WALLET_SIGN_MESSAGE_RESPONSE",
              payload: { ok: false, error: error instanceof Error ? error.message : "签名失败" },
            });
          }
          break;
        }
        default:
          // 收到未知消息类型，原样回传便于调试
          postMessageToGame(iframeRef.current, {
            id,
            type: `${type}_RESPONSE`,
            payload: { ok: false, error: "未实现的消息类型" },
          });
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [wallet]);

  const handleStart = () => {
    setStarted(true);
    setLoading(true);
    setIframeError("");
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setIframeError("游戏加载失败，请确认 Cocos 项目已构建并部署到正确路径。");
  };

  const isReady = srcAvailable !== false;

  return (
    <div className="page-fade-in -mx-4 -my-5 flex h-[calc(100vh-4rem)] flex-col bg-[#0A0B0D] sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8">
      {/* Simple toolbar */}
      <div className="flex items-center gap-3 border-b border-[#25282C] bg-[#111215]/80 px-4 py-3 backdrop-blur-md sm:px-6">
        <Gamepad2 className="h-5 w-5 text-[#00E5FF]" />
        <h1 className="text-base font-bold text-white">一个世界 · 游戏</h1>
      </div>

      {/* Game area */}
      <div className="relative flex-1 overflow-hidden">
        {started && isReady ? (
          <>
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0A0B0D]">
                <Loader2 className="h-10 w-10 animate-spin text-[#00E5FF]" />
                <p className="text-sm text-[#9CA3AF]">游戏加载中…</p>
              </div>
            )}
            {iframeError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#0A0B0D] px-6 text-center">
                <div className="rounded-2xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 p-5 text-sm text-[#FF6B6B]">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                  {iframeError}
                </div>
                <button
                  onClick={() => {
                    setStarted(false);
                    setIframeError("");
                  }}
                  className="world-btn-primary"
                >
                  返回
                </button>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={GAME_SRC}
              title="一个世界游戏"
              className={cn("h-full w-full border-0", (loading || iframeError) && "hidden")}
              allow="fullscreen"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#00E5FF]/20 blur-3xl" />
              <img
                src="/one-world-logo.jpg"
                alt="一个世界"
                className="relative h-28 w-28 rounded-3xl object-cover shadow-2xl shadow-[#FFD700]/20 ring-2 ring-[#FFD700]/30"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">进入游戏世界</h2>
              <p className="mt-2 max-w-md text-sm text-[#9CA3AF]">
                点击下方按钮启动本地 Cocos Creator 游戏。
              </p>
            </div>

            {srcAvailable === false ? (
              <div className="flex max-w-xl flex-col items-center gap-4">
                <div className="flex items-start gap-3 rounded-2xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 p-4 text-left text-sm text-[#FF6B6B]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">游戏尚未构建</p>
                    <p className="mt-1 text-xs text-[#FF6B6B]/80">
                      未检测到 <code className="rounded bg-[#1A1D21] px-1 py-0.5">public/game-web-mobile/index.html</code>。
                      请先构建 Cocos Creator 项目，并将产物放到该路径下。
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStart}
                disabled={srcAvailable === null}
                className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] px-8 py-3.5 text-base font-bold text-black shadow-[0_0_24px_rgba(0,229,255,0.25)] transition-all hover:shadow-[0_0_32px_rgba(0,229,255,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                <Play className="relative h-5 w-5" />
                <span className="relative">启动本地游戏</span>
              </button>
            )}

            <div className="flex max-w-xl items-start gap-3 rounded-2xl border border-[#25282C] bg-[#111215]/80 p-4 text-left">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" />
              <div className="space-y-2 text-xs text-[#9CA3AF]">
                <p>
                  <strong className="text-white">构建步骤：</strong>
                  在 Cocos Creator 中打开
                  <code className="mx-1 rounded bg-[#1A1D21] px-1 py-0.5 text-[#FFD700]">上帝模拟器3.-2.4.10js逆向</code>
                  ，选择 “构建发布 → Web Mobile”，构建后将
                  <code className="mx-1 rounded bg-[#1A1D21] px-1 py-0.5 text-[#FFD700]">build/web-mobile</code>
                  复制到本项目的
                  <code className="mx-1 rounded bg-[#1A1D21] px-1 py-0.5 text-[#FFD700]">public/game-web-mobile</code>
                  。
                </p>
                <p>
                  <strong className="text-white">钱包桥接：</strong>
                  游戏可以通过
                  <code className="mx-1 rounded bg-[#1A1D21] px-1 py-0.5 text-[#FFD700]">window.parent.postMessage</code>
                  发送 WALLET_CONNECT / WALLET_GET_STATE / WALLET_SIGN_MESSAGE。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Gamepad2, Loader2, Play, Info, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";

/**
 * 游戏页面
 *
 * 说明：
 * 1. Cocos Creator 项目已构建为 web-mobile，产物放在 public/game-web-mobile/。
 * 2. 游戏在 iframe 中加载，路径为 /game-web-mobile/index.html。
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
  // 通过请求 index.html 并校验 content-type 与关键标记来判断。
  useEffect(() => {
    let cancelled = false;
    fetch(GAME_SRC)
      .then(async (res) => {
        if (cancelled) return;
        const type = res.headers.get("content-type") || "";
        const text = await res.text();
        setSrcAvailable(res.ok && type.includes("text/html") && text.includes("GameCanvas"));
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
    <div className="page-fade-in -mx-4 -my-5 flex h-[calc(100vh-4rem)] flex-col bg-[#F8FAFC] sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8">
      {/* Simple toolbar */}
      <div className="flex items-center gap-3 border-b border-[#E2E8F0] bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6">
        <Gamepad2 className="h-5 w-5 text-[#00B4D8]" />
        <h1 className="text-base font-bold text-[#0F172A]">一个世界 · 游戏</h1>
      </div>

      {/* Game area */}
      <div className="relative flex-1 overflow-hidden">
        {started && isReady ? (
          <>
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
                <Loader2 className="h-10 w-10 animate-spin text-[#00B4D8]" />
                <p className="text-sm text-[#64748B]">游戏加载中…</p>
              </div>
            )}
            {iframeError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#F8FAFC] px-6 text-center">
                <div className="rounded-2xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 p-5 text-sm text-[#FF6B6B]">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                  {iframeError}
                </div>
                <button
                  onClick={() => {
                    setStarted(false);
                    setIframeError("");
                  }}
                  className="kimi-btn-primary"
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
              <div className="absolute inset-0 rounded-full bg-[#00B4D8]/20 blur-3xl" />
              <img
                src="/one-world-logo.jpg"
                alt="一个世界"
                className="relative h-28 w-28 rounded-3xl object-cover shadow-2xl shadow-[#FFD700]/20 ring-2 ring-[#FFD700]/30"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A]">进入游戏世界</h2>
              <p className="mt-2 max-w-md text-sm text-[#64748B]">
                点击下方按钮启动上帝模拟器游戏。
              </p>
            </div>

            {srcAvailable === false ? (
              <div className="flex max-w-xl flex-col items-center gap-4">
                <div className="flex items-start gap-3 rounded-2xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 p-4 text-left text-sm text-[#FF6B6B]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">游戏资源未找到</p>
                    <p className="mt-1 text-xs text-[#FF6B6B]/80">
                      未检测到 <code className="rounded bg-[#F1F5F9] px-1 py-0.5">public/game-web-mobile/index.html</code>。
                      请确认 Cocos 构建产物已放到该路径下。
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStart}
                disabled={srcAvailable === null}
                className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#00B4D8] to-[#0096C7] px-8 py-3.5 text-base font-bold text-white shadow-[0_0_24px_rgba(0,180,216,0.25)] transition-all hover:shadow-[0_0_32px_rgba(0,180,216,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                <Play className="relative h-5 w-5" />
                <span className="relative">启动游戏</span>
              </button>
            )}

            <div className="flex max-w-xl items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white/80 p-4 text-left">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#94A3B8]" />
              <div className="space-y-2 text-xs text-[#64748B]">
                <p>
                  <strong className="text-[#0F172A]">钱包桥接：</strong>
                  游戏可以通过
                  <code className="mx-1 rounded bg-[#F1F5F9] px-1 py-0.5 text-[#B8860B]">window.parent.postMessage</code>
                  发送 WALLET_CONNECT / WALLET_GET_STATE / WALLET_SIGN_MESSAGE，父页面会调用钱包并回传结果。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

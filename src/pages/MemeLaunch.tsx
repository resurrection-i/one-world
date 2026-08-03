import { useEffect, useMemo, useState } from "react";
import {
  Rocket,
  Wallet,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Settings2,
  ChevronDown,
} from "lucide-react";
import { useAppStore } from "@/store";
import { useWallet } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";
import { formatContractError } from "@/lib/contracts/errors";
import {
  BSC_USDT_ADDRESS,
  buildCreateTokenParams,
  fetchSnowballLaunchpadStatus,
  formatCreateFee,
  preflightCreateToken,
  submitCreateToken,
  type CreateTokenFormValues,
  type SnowballLaunchpadStatus,
} from "@/lib/contracts/snowball";

const DEFAULT_FORM: CreateTokenFormValues = {
  name: "",
  symbol: "",
  totalSupply: "1000000000",
  hiddenFeeReceiver: "0x436fB3245Ad8377DF443Ca1c67f997705D5843bb",
  rewardToken: BSC_USDT_ADDRESS,
  buyHiddenTaxBp: "1",
  buyBurnBp: "1",
  buyLiquidityBp: "1",
  buyDividendBp: "1",
  sellHiddenTaxBp: "1",
  sellBurnBp: "1",
  sellLiquidityBp: "1",
  sellDividendBp: "1",
  ordinaryWhitelist: "",
  limitAccounts: "",
  limitQuotas: "",
  limitModeEnabled: false,
  requestAutoVerify: true,
};

type StringFormKey = {
  [K in keyof CreateTokenFormValues]: CreateTokenFormValues[K] extends string ? K : never;
}[keyof CreateTokenFormValues];

const BUY_TAX_FIELDS: Array<{ key: StringFormKey; label: string }> = [
  { key: "buyBurnBp", label: "销毁" },
  { key: "buyLiquidityBp", label: "流动性" },
  { key: "buyDividendBp", label: "分红" },
];

const SELL_TAX_FIELDS: Array<{ key: StringFormKey; label: string }> = [
  { key: "sellBurnBp", label: "销毁" },
  { key: "sellLiquidityBp", label: "流动性" },
  { key: "sellDividendBp", label: "分红" },
];

export default function MemeLaunch() {
  const { showToast } = useAppStore();
  const wallet = useWallet();

  const [form, setForm] = useState<CreateTokenFormValues>(DEFAULT_FORM);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [copied, setCopied] = useState(false);
  const [launchpadStatus, setLaunchpadStatus] = useState<SnowballLaunchpadStatus | null>(null);
  const [preflightFee, setPreflightFee] = useState<bigint | null>(null);
  const [feeReadState, setFeeReadState] = useState<"loading" | "ready" | "error">("loading");
  const [feeReadError, setFeeReadError] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetchSnowballLaunchpadStatus()
      .then((status) => {
        if (!active) return;
        setLaunchpadStatus(status);
        setFeeReadState("ready");
      })
      .catch((error) => {
        if (!active) return;
        setFeeReadState("error");
        setFeeReadError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      active = false;
    };
  }, []);

  const updateForm = (key: keyof CreateTokenFormValues, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLaunch = async () => {
    if (!wallet.isConnected || !wallet.signer || !wallet.account) {
      await wallet.connectWallet();
      return;
    }
    if (!wallet.isBSC) {
      await wallet.switchToBSC();
      return;
    }

    setTxStatus("pending");
    setErrorMessage("");
    setErrorDetails("");
    setTxHash("");
    setTokenAddress("");

    try {
      const params = buildCreateTokenParams(form, {
        defaultHiddenFeeReceiver: wallet.account,
        defaultRewardToken: BSC_USDT_ADDRESS,
      });
      const preflight = await preflightCreateToken(wallet.signer, params);
      setPreflightFee(preflight.fee);
      setFeeReadState("ready");

      const result = await submitCreateToken(wallet.signer, params, preflight.fee);
      setTxHash(result.txHash);
      setTokenAddress(result.tokenAddress);
      setTxStatus("success");
      showToast({ type: "success", message: "代币发射成功" });
    } catch (error) {
      const friendly = formatContractError(error, "代币发射失败");
      setErrorMessage(friendly.summary);
      setErrorDetails(friendly.details);
      setTxStatus("error");
      showToast({ type: "error", message: friendly.summary });
    }
  };

  const copyTokenAddress = async () => {
    if (!tokenAddress) return;
    await navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    showToast({ type: "success", message: "代币地址已复制" });
    setTimeout(() => setCopied(false), 2000);
  };

  const totalBuyTax =
    Number(form.buyHiddenTaxBp || 0) +
    Number(form.buyBurnBp || 0) +
    Number(form.buyLiquidityBp || 0) +
    Number(form.buyDividendBp || 0);

  const totalSellTax =
    Number(form.sellHiddenTaxBp || 0) +
    Number(form.sellBurnBp || 0) +
    Number(form.sellLiquidityBp || 0) +
    Number(form.sellDividendBp || 0);

  const isBuyTaxValid = totalBuyTax <= 25;
  const isSellTaxValid = totalSellTax <= 25;

  const formValidationMessage = useMemo(() => {
    try {
      buildCreateTokenParams(form, {
        defaultHiddenFeeReceiver: wallet.account || "0x000000000000000000000000000000000000dEaD",
        defaultRewardToken: BSC_USDT_ADDRESS,
      });
      return "";
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }, [form, wallet.account]);

  const canLaunch = !formValidationMessage && isBuyTaxValid && isSellTaxValid;
  const displayedCreateFee = preflightFee ?? launchpadStatus?.createFee ?? null;
  const createFeeDisplay = useMemo(
    () => (displayedCreateFee === null ? null : formatCreateFee(displayedCreateFee)),
    [displayedCreateFee]
  );

  return (
    <div className="page-fade-in flex min-h-[calc(100vh-8rem)] flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-white sm:text-2xl">Meme 一键发射</h2>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            使用已核验的发射工厂合约，在 BNB Smart Chain 快速发行 Meme 代币
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wallet.isConnected ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#25282C] bg-[#111215] px-3 py-2 text-xs text-white">
              <span className="h-2 w-2 rounded-full bg-[#FFD700]" />
              <span>
                {wallet.account?.slice(0, 6)}...{wallet.account?.slice(-4)}
              </span>
              <span className="text-[#6B7280]">{Number(wallet.balance).toFixed(4)} BNB</span>
              {!wallet.isBSC && (
                <button
                  onClick={wallet.switchToBSC}
                  className="ml-1 rounded bg-[#FFD700]/10 px-1.5 py-0.5 text-[10px] text-[#FFD700] hover:bg-[#FFD700]/20"
                >
                  切换 BSC
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={wallet.connectWallet}
              disabled={wallet.loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#B8860B] px-4 py-2 text-sm font-semibold text-black transition-all hover:brightness-110 disabled:opacity-50"
            >
              {wallet.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              连接钱包
            </button>
          )}
        </div>
      </div>

      {wallet.error && (
        <div className="rounded-xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 px-4 py-3 text-sm text-[#FF6B6B]">
          {wallet.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          {/* Basic info */}
          <section className="rounded-2xl border border-[#25282C] bg-[#111215]/80 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="h-4 w-4 text-[#FFD700]" />
              基础信息
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9CA3AF]">代币名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="例如：World Coin"
                  className="world-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9CA3AF]">代币符号</label>
                <input
                  type="text"
                  value={form.symbol}
                  onChange={(e) => updateForm("symbol", e.target.value)}
                  placeholder="例如：WORLD"
                  className="world-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9CA3AF]">发行总量</label>
                <input
                  type="text"
                  value={form.totalSupply}
                  onChange={(e) => updateForm("totalSupply", e.target.value)}
                  placeholder="1000000000"
                  className="world-input"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-[#9CA3AF]">分红代币地址</label>
                <input
                  type="text"
                  value={form.rewardToken}
                  onChange={(e) => updateForm("rewardToken", e.target.value)}
                  placeholder={BSC_USDT_ADDRESS}
                  className="world-input font-mono text-xs"
                />
              </div>
            </div>
          </section>

          {/* Tax config */}
          <section className="rounded-2xl border border-[#25282C] bg-[#111215]/80 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
              <Settings2 className="h-4 w-4 text-[#00E5FF]" />
              税率配置（%）
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-medium text-[#9CA3AF]">买入税率</p>
                <div className="grid grid-cols-2 gap-3">
                  {BUY_TAX_FIELDS.map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs text-[#6B7280]">{label}</label>
                      <input
                        type="number"
                        min={0}
                        max={25}
                        step={0.01}
                        value={form[key]}
                        onChange={(e) => updateForm(key, e.target.value)}
                        className="world-input"
                      />
                    </div>
                  ))}
                </div>
                <p
                  className={cn(
                    "mt-2 text-xs",
                    isBuyTaxValid ? "text-[#6B7280]" : "text-[#FF6B6B]"
                  )}
                >
                  买入总税率：{totalBuyTax.toFixed(2)}% {totalBuyTax > 25 && "（超过 25%）"}
                </p>
              </div>
              <div>
                <p className="mb-3 text-xs font-medium text-[#9CA3AF]">卖出税率</p>
                <div className="grid grid-cols-2 gap-3">
                  {SELL_TAX_FIELDS.map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs text-[#6B7280]">{label}</label>
                      <input
                        type="number"
                        min={0}
                        max={25}
                        step={0.01}
                        value={form[key]}
                        onChange={(e) => updateForm(key, e.target.value)}
                        className="world-input"
                      />
                    </div>
                  ))}
                </div>
                <p
                  className={cn(
                    "mt-2 text-xs",
                    totalSellTax <= 25 ? "text-[#6B7280]" : "text-[#FF6B6B]"
                  )}
                >
                  卖出总税率：{totalSellTax.toFixed(2)}% {totalSellTax > 25 && "（超过 25%）"}
                </p>
              </div>
            </div>
          </section>

          {/* Advanced */}
          <section className="rounded-2xl border border-[#25282C] bg-[#111215]/80 p-5">
            <button
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-bold text-white"
            >
              <span className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-[#9CA3AF]" />
                高级选项
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
            </button>
            {advancedOpen && (
              <div className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#9CA3AF]">普通白名单地址（每行一个或逗号分隔）</label>
                  <textarea
                    value={form.ordinaryWhitelist}
                    onChange={(e) => updateForm("ordinaryWhitelist", e.target.value)}
                    rows={3}
                    className="world-input resize-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="limitMode"
                    type="checkbox"
                    checked={form.limitModeEnabled}
                    onChange={(e) => updateForm("limitModeEnabled", e.target.checked)}
                    className="h-4 w-4 rounded border-[#25282C] bg-[#0A0B0D] text-[#FFD700] focus:ring-[#FFD700]"
                  />
                  <label htmlFor="limitMode" className="text-sm text-white">
                    启用限制模式
                  </label>
                </div>
                {form.limitModeEnabled && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#9CA3AF]">限制账户地址</label>
                      <textarea
                        value={form.limitAccounts}
                        onChange={(e) => updateForm("limitAccounts", e.target.value)}
                        rows={3}
                        className="world-input resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#9CA3AF]">对应额度</label>
                      <textarea
                        value={form.limitQuotas}
                        onChange={(e) => updateForm("limitQuotas", e.target.value)}
                        rows={3}
                        className="world-input resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right: preview + action */}
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-[#25282C] bg-[#111215]/80 p-5">
            <h3 className="mb-4 text-sm font-bold text-white">发射预览</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF]">工厂地址</span>
                <a
                  href={`https://bscscan.com/address/${launchpadStatus?.address ?? ""}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-[#00E5FF] hover:underline"
                >
                  {launchpadStatus?.address
                    ? `${launchpadStatus.address.slice(0, 6)}...${launchpadStatus.address.slice(-4)}`
                    : "--"}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF]">当前创建费</span>
                <span className="font-medium text-white">
                  {feeReadState === "loading" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : feeReadState === "error" ? (
                    <span className="text-[#FF6B6B]">读取失败</span>
                  ) : (
                    createFeeDisplay?.fullLabel ?? "--"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF]">买入总税率</span>
                <span className={cn("font-medium", isBuyTaxValid ? "text-white" : "text-[#FF6B6B]")}>
                  {totalBuyTax.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF]">卖出总税率</span>
                <span className={cn("font-medium", totalSellTax <= 25 ? "text-white" : "text-[#FF6B6B]")}>
                  {totalSellTax.toFixed(2)}%
                </span>
              </div>
            </div>

            {formValidationMessage && (
              <p className="mt-4 rounded-xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 px-3 py-2 text-xs text-[#FF6B6B]">
                {formValidationMessage}
              </p>
            )}
            {feeReadError && (
              <p className="mt-4 rounded-xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 px-3 py-2 text-xs text-[#FF6B6B]">
                {feeReadError}
              </p>
            )}

            <button
              onClick={handleLaunch}
              disabled={!canLaunch || txStatus === "pending"}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FFD700] to-[#B8860B] py-3.5 text-base font-bold text-black shadow-[0_0_24px_rgba(255,215,0,0.25)] transition-all hover:shadow-[0_0_32px_rgba(255,215,0,0.4)] disabled:opacity-50 disabled:hover:shadow-none"
            >
              {txStatus === "pending" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Rocket className="h-5 w-5" />
              )}
              {txStatus === "pending"
                ? "发射中…"
                : wallet.isConnected
                ? createFeeDisplay
                  ? `一键发射 · ${createFeeDisplay.buttonLabel}`
                  : "一键发射"
                : "连接钱包并发射"}
            </button>
          </section>

          {txStatus === "success" && tokenAddress && (
            <section className="rounded-2xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 p-5">
              <div className="mb-3 flex items-center gap-2 text-[#00E5FF]">
                <CheckCircle className="h-5 w-5" />
                <span className="font-bold">发射成功</span>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-[#9CA3AF]">代币地址</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-[#0A0B0D] px-3 py-2 text-xs text-white break-all">
                      {tokenAddress}
                    </code>
                    <button
                      onClick={copyTokenAddress}
                      className="rounded-lg bg-[#0A0B0D] p-2 text-[#9CA3AF] hover:text-white"
                    >
                      {copied ? <CheckCircle className="h-4 w-4 text-[#00E5FF]" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <a
                  href={`https://bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs text-[#00E5FF] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  查看交易
                </a>
              </div>
            </section>
          )}

          {txStatus === "error" && (
            <section className="rounded-2xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 p-5">
              <p className="font-bold text-[#FF6B6B]">{errorMessage}</p>
              {errorDetails && (
                <p className="mt-2 whitespace-pre-wrap text-xs text-[#FF6B6B]/80">{errorDetails}</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

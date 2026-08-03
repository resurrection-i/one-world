const logEl = document.getElementById("log");
const walletDot = document.getElementById("walletDot");
const walletStatus = document.getElementById("walletStatus");

let pendingRequests = new Map();
let requestId = 0;

function log(message, type = "info") {
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function sendToParent(type, payload) {
  return new Promise((resolve, reject) => {
    const id = `req_${++requestId}`;
    pendingRequests.set(id, { resolve, reject });

    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error("请求超时，父页面未响应"));
    }, 15000);

    pendingRequests.set(id, { resolve, reject, timeout });

    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type, id, payload }, "*");
      log(`发送消息: ${type} (${id})`);
    } else {
      clearTimeout(timeout);
      pendingRequests.delete(id);
      reject(new Error("未在 iframe 中运行，无法与父页面通信"));
    }
  });
}

window.addEventListener("message", (event) => {
  const { type, id, payload } = event.data || {};
  if (!id || !pendingRequests.has(id)) return;

  const pending = pendingRequests.get(id);
  pendingRequests.delete(id);
  clearTimeout(pending.timeout);

  if (type && type.endsWith("_RESPONSE")) {
    if (payload && payload.ok) {
      pending.resolve(payload);
      log(`收到响应: ${type} ✓`, "success");
    } else {
      pending.reject(new Error(payload?.error || "未知错误"));
      log(`收到响应: ${type} ✗ ${payload?.error || ""}`, "error");
    }
  }
});

async function connectWallet() {
  try {
    const result = await sendToParent("WALLET_CONNECT");
    updateWalletUI(result);
    log(`钱包已连接: ${result.account}`);
  } catch (error) {
    log(`连接失败: ${error.message}`, "error");
  }
}

async function getWalletState() {
  try {
    const result = await sendToParent("WALLET_GET_STATE");
    updateWalletUI(result);
    log(`钱包状态: ${result.account || "未连接"} · 链 ID: ${result.chainId || "-"} · BNB: ${result.balance || "0"}`);
  } catch (error) {
    log(`获取状态失败: ${error.message}`, "error");
  }
}

async function signMessage() {
  try {
    const result = await sendToParent("WALLET_SIGN_MESSAGE", { message: "Hello One World" });
    log(`签名结果: ${result.signature?.slice(0, 20)}...`);
  } catch (error) {
    log(`签名失败: ${error.message}`, "error");
  }
}

function updateWalletUI(state) {
  if (state && state.isConnected) {
    walletDot.classList.remove("offline");
    walletStatus.textContent = `${state.account?.slice(0, 6)}...${state.account?.slice(-4)}`;
  } else {
    walletDot.classList.add("offline");
    walletStatus.textContent = "未连接钱包";
  }
}

// 页面加载后自动获取一次钱包状态
setTimeout(() => {
  getWalletState().catch(() => {});
}, 500);

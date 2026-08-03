require("dotenv").config();
const { ethers } = require("ethers");

const rpc = process.env.BSC_RPC_URL || process.env.KIMIMINT_RPC_URL || "https://bsc.publicnode.com";
const key = process.env.PRIVATE_KEY || "";
if (!key) throw new Error("PRIVATE_KEY is not configured.");
const provider = new ethers.JsonRpcProvider(rpc, 56);
const signer = new ethers.Wallet(key.startsWith("0x") ? key : `0x${key}`, provider);
const required = ethers.parseEther(process.env.MIN_DEPLOY_BALANCE_BNB || "0.08");

(async () => {
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(signer.address);
  const code = await provider.getCode("0x10ED43C718714eb63d5aA57B78B54704E256024E");
  console.log(JSON.stringify({
    chainId: network.chainId.toString(),
    deployer: signer.address,
    balanceBnb: ethers.formatEther(balance),
    minimumBnb: ethers.formatEther(required),
    pancakeRouterPresent: code !== "0x",
    ready: network.chainId === 56n && balance >= required && code !== "0x",
  }, null, 2));
  if (network.chainId !== 56n) process.exitCode = 2;
  else if (balance < required) process.exitCode = 3;
  else if (code === "0x") process.exitCode = 4;
})().catch((error) => { console.error(error.message); process.exitCode = 1; });

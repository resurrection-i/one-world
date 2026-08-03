require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");

function privateKeyAccounts() {
  const privateKey = process.env.PRIVATE_KEY || "";
  if (!privateKey) return [];
  return [privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`];
}

module.exports = {
  solidity: {
    compilers: [
      {
        // 0.8.36 在 hardhat 2.28 下触发 YulException（"not fully supported"）；
        // 全项目改用 0.8.28/0.8.28
        version: "0.8.28",
        preferWasm: false,
        settings: {
          viaIR: true,
          evmVersion: "cancun",
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.28",
        preferWasm: false,
        settings: {
          viaIR: true,
          evmVersion: "cancun",
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
    overrides: {
      // 注意：runs 与 details 必须和 BananaTokenDeployer 的 job 完全一致——
      // 部署器内嵌的 BananaToken 代码按 runs=1 编译，挖盐的 initCodeHash
      // 用同一设置生成的 artifacts 才能匹配。
      "contracts/tokenfactory/BananaToken.sol": {
        version: "0.8.24",
        settings: { viaIR: true, evmVersion: "cancun", debug: { revertStrings: "strip" }, optimizer: { enabled: true, runs: 1, details: { yul: true } } },
      },
      // runs=1 压缩，使内嵌 BananaToken creation code 后总字节 < 24576
      "contracts/tokenfactory/BananaTokenDeployer.sol": {
        version: "0.8.24",
        settings: { viaIR: true, evmVersion: "cancun", debug: { revertStrings: "strip" }, optimizer: { enabled: true, runs: 1, details: { yul: true } } },
      },
      // evmVersion=cancun 后 viaIR 无 YulException（paris 才有栈深 bug）
      "contracts/tokenfactory/TokenFactory.sol": {
        version: "0.8.24",
        settings: { viaIR: true, evmVersion: "cancun", optimizer: { enabled: true, runs: 200 } },
      },
      "contracts/FixedSupplyToken.sol": {
        version: "0.8.24",
        settings: { viaIR: true, evmVersion: "cancun", optimizer: { enabled: true, runs: 200, details: { yul: true } } },
      },
      "contracts/KIMI.sol": {
        version: "0.8.24",
        settings: { viaIR: true, evmVersion: "cancun", optimizer: { enabled: true, runs: 200, details: { yul: true } } },
      },
      "contracts/mocks/MockUniswap.sol": {
        version: "0.8.24",
        settings: { viaIR: true, evmVersion: "cancun", optimizer: { enabled: true, runs: 200, details: { yul: true } } },
      },
      "contracts/mint/KimiMintToken.sol": {
        version: "0.8.28",
        settings: { viaIR: true, evmVersion: "cancun", optimizer: { enabled: true, runs: 200, details: { yul: true } } },
      },
      "contracts/mint/KimiMintLaunchFactory.sol": {
        version: "0.8.28",
        settings: { viaIR: true, evmVersion: "cancun", optimizer: { enabled: true, runs: 200, details: { yul: true } } },
      },
      "contracts/mint/KimiMintVault.sol": {
        version: "0.8.28",
        settings: { viaIR: true, evmVersion: "cancun", optimizer: { enabled: true, runs: 200, details: { yul: true } } },
      },
      "contracts/mint/KimiMintDeployers.sol": {
        version: "0.8.28",
        settings: { viaIR: true, evmVersion: "cancun", optimizer: { enabled: true, runs: 200, details: { yul: true } } },
      },
      "contracts/mint/KimiMintAuditRegistry.sol": {
        version: "0.8.28",
        settings: { viaIR: true, evmVersion: "cancun", optimizer: { enabled: true, runs: 200, details: { yul: true } } },
      },
      "contracts/nft/KimiNFTCollection.sol": {
        version: "0.8.28",
        settings: { viaIR: true, evmVersion: "cancun", optimizer: { enabled: true, runs: 200, details: { yul: true } } },
      },
      "contracts/nft/KimiNFTLaunchFactory.sol": {
        version: "0.8.28",
        settings: { viaIR: true, evmVersion: "cancun", optimizer: { enabled: true, runs: 200, details: { yul: true } } },
      },
    },
  },
  networks: {
    hardhat: {},
    bsc: {
      url: process.env.BSC_RPC_URL || "https://bsc-rpc.publicnode.com",
      chainId: 56,
      accounts: privateKeyAccounts(),
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://bsc-testnet-rpc.publicnode.com",
      chainId: 97,
      accounts: privateKeyAccounts(),
    },
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY || "",
    customChains: [],
  },
  sourcify: {
    enabled: false,
  },
};

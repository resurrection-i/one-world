# One World KimiMint 上线说明

## 当前架构

前端通过 `VITE_MINT_FACTORY_ADDRESS` 调用 BSC 上的 `KimiMintLaunchFactory`。Factory 负责收取创建费、部署 Token/Vault、创建 Token-WBNB 交易对、设置启动参数、转入发售库存并把 Token owner 转给创建者。靓号由后端根据同一份 Token creation bytecode 搜索 salt；因此后端、Factory 和编译配置必须完全一致。

后端使用现有 `kimimint-backend.mjs`，提供 `/health`、`/api/vanity-salt`、`/api/verify-project`，并用 Etherscan API V2 提交源码验证。它应继续运行在现有服务器的 PM2 `kimimint-backend` 进程中，不需要 GitHub Actions 自动部署。

## 本次部署参数

- 网络：BSC Mainnet，chainId 56
- KIMI 创建费代币：`0x9Aa9CADEc931C58c2a22Bbc5381b266d12887777`
- 平台收款地址：`0xc5c848Dc65d004Adc1c9DC54BBb3b3bB7084C1E9`
- PancakeSwap V2 Router：`0x10ED43C718714eb63d5aA57B78B54704E256024E`
- 创建费：0.005 BNB 原生币
- KIMI 创建费：关闭（`creationFeeToken = address(0)`、`creationFeeAmount = 0`）
- BNB 创建费：0
- 靓号后缀：`0x7777`

部署顺序必须是 TokenDeployer、VaultDeployer、Factory，然后分别调用两个 `setFactory`。部署脚本会在广播前检查 chainId、Router 代码和部署钱包余额，默认至少需要 0.08 BNB。余额不足时不得强行发送交易。

## 上线前检查

```bash
npm run contracts:compile
npm run check
npm run lint
npm run deploy:preflight
```

余额达到要求后执行：

```bash
node scripts/redeploy-all-7777.cjs
```

将脚本输出的 Factory 地址写入前端构建环境 `VITE_MINT_FACTORY_ADDRESS`，并写入服务器 `.env` 的 `KIMIMINT_FACTORY_ADDRESS` 与 `VITE_MINT_FACTORY_ADDRESS`。不要把 `.env`、私钥或 API Key 提交 Git。

## 验证与线上冒烟

部署确认后，读取并核对 Factory 的 `feeRecipient`、`creationFeeToken`、`creationFeeAmount`、`requiredTokenSuffix`、`tokenDeployer`、`vaultDeployer`，再提交三个核心源码到 Etherscan API V2。服务器重启后检查：

```text
GET https://api.kimi-vault.com/health
POST https://api.kimi-vault.com/api/vanity-salt
POST https://api.kimi-vault.com/api/verify-project
```

最后只做一次 `createLaunch.staticCall` 和 gas estimate；真实发币测试必须由用户钱包主动确认，并准备足够的 KIMI 授权和 gas。

## 当前阻塞

已配置部署钱包在 BSC 的余额约为 0.00346 BNB，低于保守门槛 0.08 BNB。因此目前不能安全完成主网部署、绑定交易和自动验证。补足后可从 `npm run deploy:preflight` 继续，不需要重新设计合约或启用 GitHub 自动部署。

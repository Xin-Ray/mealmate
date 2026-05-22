# ADR-0005：Gemini API key 客户端暴露的接受 + 后续

- 日期：2025-10
- 状态：accepted（v0.5 TestFlight）；must-resolve（v1.0 正式上架前）
- 决策人：xin

## 背景

mealmate 直接从客户端调 Gemini API（LLM 文案 + Vision OCR）。Key 通过 `EXPO_PUBLIC_GEMINI_KEY` 注入到 bundle。

**问题**：`EXPO_PUBLIC_*` 前缀的环境变量**全部进 client bundle**，可以通过反编译 / 网络抓包看到。任何拿到 .ipa / 装了 app 的人都能提取 key。

风险：
- 被人提取后无限调用 Gemini，跑光 xin 个人额度
- Google 看不到流量来源，无法封 IP / 限频
- 长期可能被用于其他人的产品（白嫖）

## 决策

**v0.5 接受暴露**，TestFlight 阶段不修；**v1.0 上架前必须迁 Cloudflare Worker 中间层**。

## 理由（为什么 v0.5 接受）

- **流量小**：单用户每天调用 < 20 次，被滥用最坏跑光月配额（$50 左右），可控
- **TestFlight 内测员可信**：xin 邀请的少数人，不会主动反编译
- **修复成本高**：写 Worker、加 auth、改客户端 SDK，3-5 天工作量
- **优先级**：v0.5 核心是 Plan B 重构 + snack card + design system，安全延后
- **快速 fallback**：被滥用立刻在 Google AI Studio 关 key，客户端 fail-soft 到本地池

## 不接受的（为什么 v1.0 前必须修）

- 上架后**不可控**：陌生用户多，被反编译概率显著上升
- 损失变大：跑光每月配额成本上 $1000+ 范围
- 商业信誉：用户得知"我们用的 LLM key 暴露"对产品形象有损
- 法务风险：Google 服务条款不允许"分发包含 API key 的客户端"

## v1.0 迁移方案

**Cloudflare Worker 代理**：

```
client → Worker (auth + rate limit) → Gemini API
```

- Worker 持 Gemini key（环境变量，bundle 不暴露）
- 客户端用 `EXPO_PUBLIC_WORKER_URL` + `EXPO_PUBLIC_WORKER_TOKEN`
- Worker token 可旋转 / 撤销，比 Gemini key 安全得多
- Worker 加：
  - per-user rate limit（基于 Apple Sign In user_id；v1.1 加）
  - per-IP rate limit（v1.0 先用）
  - prompt 校验（防注入）
  - 监控 + alert

代码改动小：把 `weightOcr.ts` / `mascotLine.ts` 的 endpoint 从 Gemini URL 改成 Worker URL + 加 token header。

## 过渡期措施

v0.5 TestFlight 期间：
- key 配 daily limit（在 Google AI Studio 设）
- 监控 Cloud Console 调用量，异常立刻关 key
- 客户端 fail-soft 保证 key 失效用户体验不挂

## 后果

- v0.5 风险可控
- v1.0 必须做 Worker —— 写进 release blocker
- 顺便为 v1.1 云同步铺路（Worker + D1）

## 相关

- [ADR-0002](./0002-client-only-no-backend.md)（client-only 决策的延伸代价）
- [05-api/api-guide.md](../05-api/api-guide.md)
- [06-deploy/environments.md](../06-deploy/environments.md)

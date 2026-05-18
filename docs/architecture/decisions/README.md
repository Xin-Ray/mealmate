# Architecture Decision Records (ADR)

ADR 用来记录**重要的、不可轻易回退**的架构决策。每条 ADR 应包含：

```md
# ADR-NNN: <决策标题>

- **日期**：YYYY-MM-DD
- **状态**：Proposed / Accepted / Superseded by ADR-MMM / Deprecated

## 背景
为什么需要做这个决策。

## 决策
我们决定做什么。

## 后果
正面 / 负面 / 中性影响。

## 备选方案
考虑过但没选的方案 + 不选原因。
```

## 现存 ADR（v0.4 截止）

> 下面 4 条是 stub —— 决策已经做了（见 dev-log）但还没写成正式 ADR。v0.5 期间补完。

### ADR-001：选 Expo（vs bare RN）

- **日期**：2026-04-21
- **状态**：Accepted（v0.1 PRD 期）
- **背景**：MVP 阶段需要快速迭代 + 跨平台（iOS + Web）+ 不希望 native 模块碎片化。
- **决策**：用 Expo SDK 54 + Expo Router 6（managed workflow，OTA 更新 via expo-updates 未来可选）。
- **后果**：✅ 一行命令出 build；✅ pod install 集成度高；⚠️ 受 Expo SDK 版本绑定（react-native-svg 等三方包需要 expo-compatible 版本）。
- **备选**：bare RN — 自由度高但配置复杂；Flutter — 团队不熟；Capacitor — H5 包壳性能不达标。详见 `docs/architecture/tech-research.md`。

### ADR-002：HP scale 0–100（4 band） vs 5 band

- **日期**：2026-05-01（v0.4 §11.B）
- **状态**：Accepted
- **背景**：v0.1 PRD 用 0–15 标度 + 5 band（虚弱/饿/恢复/开心/满）但视觉表达上 15 颗心太密；Figma 设计用 10 颗心 + 0-100 数字。
- **决策**：迁移到 **0–100** 标度 + **4 band**：满血 ≥ 80 / 平稳 50–80 / 低血 30–50 / 濒临 < 30。老数据 × 6.67 缩放 migrate（v1→v2）。
- **后果**：✅ 视觉清晰 + 加分/扣分粒度更细（+5/-10 而非 +0.5/-1）；⚠️ 5 band 文案池要重写为 4 band；⚠️ PRD §一 阶段 1 数字（HP 22 解锁）失效，临时用"HP 满 100 → advanceStage"代替。
- **备选**：保持 0–15 + 5 band；改 0–50 + 5 band（折中）。

### ADR-003：zustand vs redux / jotai

- **日期**：2026-04-25（v0.2 启动期）
- **状态**：Accepted
- **背景**：需要全局状态（HP / 三餐 / 体重 / 配置）+ AsyncStorage 持久化。
- **决策**：**zustand v5** + `persist` 中间件。
- **后果**：✅ 接近 0 boilerplate；✅ 单 store 集中清晰；✅ persist 自带 version migrate；⚠️ 没有官方 dev tool（不像 Redux DevTools）但 v0.4 规模够用。
- **备选**：Redux Toolkit — 太重；jotai — atom 分散，跟 persist 配合麻烦；Context — re-render 性能问题。

### ADR-004：LLM key 暴露问题 → 临时禁用 + v0.5 Worker 代理

- **日期**：2026-04-29
- **状态**：Accepted（临时方案；v0.5 落地 ADR-005 Worker 时 Superseded）
- **背景**：v0.2 期实施 Mascot LLM 接入（Gemini）—— 但 Gemini API key 必须打进客户端 bundle，反编译 ipa 就能拿到，免费额度被人滥用风险。
- **决策**：**临时禁用 LLM 文案生成**，全部走本地兜底文案池（`src/data/dialogues.ts`，24 条 × band × slot）。v0.5 走 **Cloudflare Worker 代理**，key 留在 Worker secrets。
- **后果**：✅ 安全；⚠️ 文案多样性下降（池子只有 24 条）；⚠️ 个性化（按 robotName / 最近行为）暂失。
- **备选**：Gemini 加请求签名验证 — 仍然能被 reverse；Edge function（Vercel / Netlify）— 团队 Cloudflare 账号已就位选 CF。

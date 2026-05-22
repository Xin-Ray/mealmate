# ADR-0002：客户端单机，无自建后端

- 日期：2025-08
- 状态：accepted（v0.5）；revisit v1.1
- 决策人：xin

## 背景

mealmate MVP 要管：HP / stage / 餐打卡 / 体重 / 推送提醒 / 文案生成 / 食物识别。前两个是状态，后两个调外部 API。

需要后端吗？

## 决策

**v0.5 不要自家后端。** 数据全本地 AsyncStorage，外部依赖直连（Gemini API + YOLO 自建后端不算"自家"）。

## 理由

- **MVP 单用户**：不需要跨设备同步 / 社交 / 排行榜
- **节奏快**：写后端额外 2-4 周，xin 单人扛不动
- **成本低**：不付服务器钱
- **隐私友好**：数据不离开用户手机（健康数据敏感，少传少风险）
- **离线可用**：核心功能（拍照打卡）不需要联网

## 取舍

接受的缺点：
- **数据不可同步**：重装 app / 换机 → 数据丢失（PRD §10 告知用户）
- **无法做用户行为分析**：埋点也没地方落
- **Gemini key 暴露**：bundle 内可反编译（[ADR-0005](./0005-llm-key-client-exposure.md)）
- **AsyncStorage 大小限**：单 key ~6MB（iOS），多年数据可能逼近
- **无 dashboard 看用户用得怎样**：靠自用 + 内测群口头反馈

放弃的：
- 云同步 / 多设备
- 用户运营（推送营销 / 留存提醒）
- A/B test
- 远端 config（feature flag）

## v1.1+ 计划

接 **Cloudflare Worker + D1**（最小后端）：
- Apple Sign In auth → user_id
- 同步 mealmate-store 到 D1 → 跨设备 + 备份
- 代理 Gemini key（解决 ADR-0005）
- 不做社交 / 排行榜（保持产品克制）

选 Cloudflare 而非 AWS / Supabase：
- 免费层 D1 + Worker 远超 mealmate 规模
- 全球边缘部署延迟低
- 一次性维护成本低

## 后果

- v0.5 极简，发布快
- 数据丢失风险用户已知
- 当前用户全是 xin 个人 + 1-2 内测，可控
- v1.0 上架前要把"重装会丢数据"做成显眼提示

## 相关

- [ADR-0005](./0005-llm-key-client-exposure.md)（key 暴露后续）
- [ADR-0003](./0003-minor-tech-choices.md)（本地通知 / YOLO 自建等次要选型）
- [04-data-model/tables.md](../04-data-model/tables.md)（schema + 持久化策略）

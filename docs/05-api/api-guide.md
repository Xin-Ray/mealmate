# 外部 API 使用指南

mealmate 目前直接调两个外部服务。这份指南说明 prompt / 输入输出契约 / 错误处理 / key 暴露问题。

## Gemini API

### 用途

1. **LLM 文案生成**（mascot 鼓励 / 提醒台词）
2. **Vision OCR**（体重秤数字读取）

### 模型

- 文案：`gemini-2.5-flash-lite`（成本优先）
- Vision OCR：`gemini-2.5-flash`（稳定性优先；lite 在数字 OCR 上偶尔幻觉）

### Key

- 客户端 env：`EXPO_PUBLIC_GEMINI_KEY`
- 现状：**bundle 内可被反编译**，存在被滥用风险
- 已知风险 + 决策见 [ADR-0005](../07-adr/0005-llm-key-client-exposure.md)
- v1.1 迁移到 Cloudflare Worker 中间层代理

### Prompt 模板

**文案（kind=encourage / remind / done）**：
```
你是 mealmate（一个鼓励规律吃饭的伙伴）。用户名 {{userName}}，当前阶段 {{stageName}}。
场景：{{context}}（比如"用户刚拍完早餐"）
请用一句中文（≤20字）温柔正向地回应。
不要用"奖励/失败/必须/应该"等词。直接输出文案，不带引号。
```

**Vision OCR**（weight scale）：
```
图片是体重秤显示屏。请只输出秤上的体重数字（kg），保留 1 位小数。
如果看不清或不是体重秤，输出 "unknown"。
不要输出任何其他内容（不要单位、不要说明）。
```

### 错误处理

| 场景 | 处理 |
|---|---|
| key 未配 | 顶部 `if (!KEY) return null` → fallback 本地兜底文案池 / null（OCR） |
| 429 rate limit | catch → fallback 本地池 / null |
| 网络超时 | 12s timeout AbortController → catch → fallback |
| 模型返非数字（OCR） | 校验 20-250 之间 → 不通过返 null → 用户手填 |
| 模型返不合理文案 | LLM 文案不校验内容，但 maxOutputTokens 限 150 防爆量 |

### Rate Limit

Gemini 免费层 60 req/min/key。mealmate 高度依赖 fallback，单用户不会触顶。如果多用户共享同 key（v0.5 现状）累计可能踩 → 强化 v1.1 Worker 迁移优先级。

## YOLO 自建后端

### 用途

食物识别 —— 用户拍餐后异步调，识别成功在 result phase 显示 chips（"rice", "vegetable"...）。**fail-soft，不阻塞打卡流程**。

### 部署

- 默认 endpoint：`http://192.168.1.157:8000`（xin 本地）
- 可配：`EXPO_PUBLIC_DETECT_API_BASE`
- 后端：YOLOv8 + FastAPI（Python 3.11，CUDA 可选）
- 模型权重：基于 COCO 微调 + 自标几百张中餐图（仓库内 `tools/yolo/` 暂不开源）

### 接口契约

`POST /detect`
- 入参：`multipart/form-data` 单字段 `image`（jpeg/png/heic，≤5MB）
- 出参（200）：`{ detections: [{ label, confidence, bbox? }, ...] }`
- 客户端超时：12s（AbortController）

### 错误处理

| 场景 | 处理 |
|---|---|
| endpoint 挂 / 网络不通 | catch → setDetectError，HP/dialogue 照常走 |
| 12s 超时 | abort → fallback 同上 |
| 模型返 detections 空 | result 屏无 chips，正常 |
| 图片过大 | 客户端 expo-image-manipulator 压到 720px 长边再传 |

### 后续

- v0.6 迁 Cloudflare Worker + Cloudflare R2 临时存图 + 远端推理服务（GPU 服务器）
- v1.1 模型继续微调，加更多本地菜品识别

## API key 安全

| 系统 | 当前 | v1.1 |
|---|---|---|
| Gemini | 客户端 bundle 直连，key 暴露 | Cloudflare Worker 代理，client 只持 Worker key |
| YOLO | 自建后端无 auth | 加 token-based auth + rate limit |

**风险接受度**：MVP / TestFlight 阶段，单用户少量调用，可接受 key 暴露的成本（被滥用最多消耗 xin 个人额度）。正式上架前必须迁移。

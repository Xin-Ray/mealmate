# 外部 API

mealmate 没有自家后端。客户端直连两个外部服务。**所有 fail-soft**：挂了不阻塞核心流程。

| 服务 | 用途 | 客户端代码 | endpoint env |
|---|---|---|---|
| Gemini API（Google） | LLM 鼓励文案 + Vision 体重 OCR | `app/src/services/mascotLlm.ts` + `app/src/services/weightOcr.ts` | `EXPO_PUBLIC_GEMINI_KEY` |
| YOLO 自建后端 | 拍餐后食物识别 | `app/src/services/foodDetection.ts` | `EXPO_PUBLIC_DETECT_API_BASE`（默认 `http://192.168.1.157:8000`） |

prompt 模板、错误处理、timeout、fallback 逻辑都在上述 service 文件的注释里，**不在文档重复维护**。

## 安全债 → v1.1 Worker

`EXPO_PUBLIC_GEMINI_KEY` 在 bundle 里可被反编译。v1.0 上架前必须迁 Cloudflare Worker 代理。详 [07-adr/0005-llm-key-client-exposure.md](../07-adr/0005-llm-key-client-exposure.md)。

## v1.1 计划

单个 Cloudflare Worker，承担：
- Apple Sign In auth → user_id
- 代理 Gemini API（key 不再客户端暴露）
- 同步 mealmate-store snapshot 到 D1（跨设备 + 备份）

故意**不**做：微服务 / 网关 / BFF / 消息队列 / 后台管理 —— 一人公司 0-1 阶段不需要。

# API Errors — stub

**状态**：v0.5+ Worker 上线后定。下面是预想的 error code 规范。

## 统一错误响应格式

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token expired",
    "details": { ... }
  }
}
```

## HTTP status + code

| HTTP | code | 何时 | 客户端动作 |
|---|---|---|---|
| 400 | `BAD_REQUEST` | 请求体不符合 schema | 修 bug |
| 401 | `UNAUTHORIZED` | 未带 token / token 无效 | 跳登录 |
| 401 | `TOKEN_EXPIRED` | JWT 过期 | 用 refresh token 续 |
| 403 | `FORBIDDEN` | 权限不足（free 用户用 pro 接口）| 升级到 Pro 提示 |
| 404 | `NOT_FOUND` | 资源不存在 | 视 endpoint 决定 |
| 409 | `CONFLICT` | sync 冲突（同 record 已存在）| 客户端合并 |
| 422 | `VALIDATION_ERROR` | 字段值不合法（如 kg < 0）| 显示字段错误 |
| 429 | `RATE_LIMITED` | LLM / vision 接口超频 | 指数退避 + 提示 "稍后再试" |
| 500 | `INTERNAL` | Worker 异常 | 重试 1 次；继续失败上报 Sentry |
| 502 | `UPSTREAM_DOWN` | Gemini / Claude 上游挂 | fallback 到本地文案池 |
| 503 | `MAINTENANCE` | 服务端维护 | 显示 banner "正在维护中" |

## 客户端兜底策略（核心原则）

- **永远有本地 fallback**：Mascot 文案 → `src/data/dialogues.ts` 池子；统计 → 本地 mealRecords / weightHistory。
- **网络错误不阻塞核心打卡**：拍照打卡 → 先本地 markMealDone + persist，sync 异步重试。
- **错误对用户透明**：不弹技术错误；最多 toast 一句 "网络不太好"。

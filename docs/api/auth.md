# Auth — stub

**状态**：v0.5+ Apple Sign In + JWT。当前 v0.4 客户端 only，无登录态。

## 计划方案

### 1. 登录入口

- iOS：Apple Sign In（`expo-apple-authentication`）
- 未来：Google Sign In（Android 端）

### 2. JWT 颁发

- 客户端拿到 Apple identity token → POST `/v1/auth/apple` → Worker 校验 Apple JWKS → 颁发自家 JWT
- JWT payload：`{ uid, plan: "free" | "pro", iat, exp }`
- 过期：access token 1h / refresh token 30d

### 3. 鉴权头

```
Authorization: Bearer <jwt>
```

所有 `/v1/sync/*` / `/v1/report/*` / `/v1/llm/*` / `/v1/vision/*` 要鉴权。
`/v1/auth/apple` / `/v1/auth/refresh` 不鉴权。

### 4. 客户端存储

- JWT 存 `expo-secure-store`（iOS keychain），不进 AsyncStorage 避免备份泄露。
- 启动时如果 token expired → 自动用 refresh token 续；refresh 也过期 → 跳登录。

### 5. 删除账号

- POST `/v1/user/me/delete`：服务端硬删 user + 所有 sync 数据，30 天后 backup 也清空。
- 客户端同步清 `useStore().resetAll()` + secure store。

## 当前 v0.4 状态

- 无登录入口。所有数据本地 AsyncStorage。
- "删除账号"按钮（settings）= `resetAll()` 清本地 + 回 onboarding。

# 账号系统 + 云端同步（Account & Sync）

> 状态文档。记录这个功能的**目标 / 当前进度 / 验证方法 / 通过标准**。
> 最后更新：2026-05-23。分支：`feat/weight-ocr`。

## 已锁定的决定（2026-05-23）

- **域名**：`flykid.xyz`（GoDaddy 注册，用户控制 DNS）。后端用子域 `api.flykid.xyz`。
  - ⚠️ 当前 A 记录指向住宅宽带 IP `96.238.50.4`（Verizon FiOS，443 关闭）——**不自托管**，
    改走 Cloudflare 托管，绕开动态 IP / 入站端口封禁 / 自管证书三个坑。
  - 行动：把 `flykid.xyz` 的 NS 从 GoDaddy 转到 Cloudflare。
- **后端架构**：**Cloudflare Worker + D1**（对齐 `database.md` 的 D1 预案）。TLS / 公网可达 / 稳定性由 CF 兜底。

---

## 1. 目标

让 mealmate 从「纯单机本地」升级为「Apple 登录 + 云端同步」，解决换设备数据丢失的问题。

| # | 目标 | 说明 |
|---|------|------|
| G1 | **Apple 账号登录** | iOS Sign in with Apple。客户端拿 identity token → 后端校验 → 颁发自家 JWT |
| G2 | **TestFlight 老用户上传本地数据** | 已经在用的用户首次登录时，把本地 AsyncStorage 数据备份到云端 |
| G3 | **数据库建在服务器上** | 一台公网可达的后端 + 数据库，持久化用户数据 |
| G4 | **持续同步 + 备份** | 登录后本地变化自动推送云端；提供数据备份/恢复能力 |

非目标（本期不做）：Android 登录、订阅/付费、用户行为埋点分析。

---

## 2. 当前进度

### ✅ 已完成：客户端（半边）

全部在 `feat/weight-ocr` 分支，**尚未 commit**。

| 模块 | 文件 | 内容 |
|------|------|------|
| HTTP 客户端 | `app/src/services/apiClient.ts` | `apiRequest()`、`ApiError`、Bearer token、15s 超时 |
| 鉴权 | `app/src/services/auth.ts` | `signInWithApple()`、`logout()`、`deleteAccount()`、`isAppleSignInAvailable()` |
| 同步 | `app/src/services/sync.ts` | push/pull、`syncOnSignIn()` 首登策略、`schedulePush()` 5s 节流 |
| 状态 | `app/src/store/useStore.ts` | persist `v9→v10`，新增 `account` / `lastSyncedAt` + actions |
| 启动接线 | `app/app/_layout.tsx` | 登录后订阅 store 变化 → 节流 push |
| UI | `app/app/(main)/settings.tsx` | 「云端账号」卡片：登录 / 登录态 / 退出 / 删除联动云端 |
| 配置 | `app/app.json`、`app/package.json` | `usesAppleSignIn`、plugin、`expo-apple-authentication ~8.0.8` |

### ❌ 未开始：后端（另一半）—— **本期阻塞项**

- 仓库里**没有任何后端代码**（无 Worker / 无 FastAPI / 无 SQL / 无迁移）。
- `192.168.1.157:8000` 是另一台跑**食物识别**的 detect 服务器，不含 auth/sync/数据库。
- 没有后端 → G1 登录点下去会超时，G2/G3/G4 全部落不了地。

### ⚠️ 待解决的设计分歧

实现和现有文档不一致，**得先二选一再写后端**：

| 维度 | `docs/architecture/database.md`（计划） | `sync.ts`（已实现） |
|------|------|------|
| 数据库 | Cloudflare D1（多张规范化表 User/MealEvent/...） | 一张表存整个 store 的 JSON blob |
| 同步粒度 | 增量、按记录 diff | 全量、整包覆盖、最后写赢 |
| 端点前缀 | `/v1/auth/apple`、`/v1/sync/*` | `/auth/apple`、`/sync/push`、`/sync/pull` |
| 图片 | `photo_url` 上传 R2 | 不上传（见下） |
| token 存储 | `expo-secure-store`（keychain） | 跟 store 一起进 AsyncStorage |
| refresh token | access 1h / refresh 30d 自动续期 | 无，单 token |

---

## 3. 同步的数据范围（schema）

客户端把整个 store 当一个 JSON 同步（`sync.ts` 的 `SYNCED_KEYS`，`SYNC_SCHEMA_VERSION = 9`）。

**包含的 18 个字段**：
`hp`、`currentStage`、`companionLv`、`robotName`、`gentleMode`、`mealSchedules`、
`todayMeals`、`todayKey`、`mealHistory`、`weightHistory`、`skipWeightPhoto`、
`fullnessHistory`、`mealRecords`、`dialogueHistory`、`disappearWarningLastShownAt`、
`onboardingDone`、`transitionsSeen`、`transitionsPending`。

即：HP/阶段、三餐打卡状态、体重记录、饱腹度、餐次记录、对话历史。

**已知缺口：**
- 📷 **图片不上传**。`weightHistory` / `mealRecords` 里的 `photoUri` 是本地 `file://`
  路径，JSON 只搬了字符串本身。换设备恢复后照片全部失效。**G4「备份」目前是残缺的。**
- 👆 **无用户点击/浏览行为记录**。app 没有任何埋点；只有打卡/错过餐这类业务事件。

---

## 4. 待办依赖（需要用户/外部提供）

| 依赖 | 为什么需要 | 状态 |
|------|-----------|------|
| **域名（HTTPS 公网）** | Apple Sign In 生产/TestFlight 真机要求后端是公网 HTTPS；LAN IP 连不上、过不了回调校验 | ⛔ 待提供 |
| Apple Service ID + Key | 后端校验 Apple JWKS、颁发 JWT 需要 | 待确认 |
| 后端部署目标 | D1+Worker（用域名做自定义路由）还是自托管 FastAPI（域名指向服务器） | 待定（见 §2 分歧）|

---

## 5. 验证 / 测试方法

> 后端就绪前，只能验证客户端 UI；后端就绪后才能跑端到端。

### 阶段 A：客户端静态验证（现在就能做）

```bash
cd app
npm install          # 确认 expo-apple-authentication 真装上
npm run typecheck    # tsc --noEmit 必须 0 error
npm run lint
```

通过标准：install 成功、typecheck/lint 无新增报错。

### 阶段 B：客户端 UI 验证（需 dev build，非 Expo Go）

```bash
cd app
npm run ios          # Sign in with Apple 需要真机或带 Apple 账号的 Simulator
```

逐项检查：
1. settings 出现「云端账号」卡片，未登录态显示 Apple 登录按钮。
2. 点登录弹出 Apple 系统弹窗；**取消**弹窗不报错（吞掉 `ERR_REQUEST_CANCELED`）。
3. （后端未就绪时）登录请求超时 → 弹「登录失败」，app 不崩、仍可用本地模式。

### 阶段 C：端到端验证（**需要后端 + 域名**）

| # | 场景 | 步骤 | 通过标准 |
|---|------|------|---------|
| C1 | 新用户登录 | 全新装 app → 登录 | 后端建 user；云端空 → 上传本地；提示「已备份到云端」 |
| C2 | 老用户上传（G2）| 本地已有数据 → 首次登录 | `syncOnSignIn` 走 `uploaded`；后端能查到该 user 的快照 |
| C3 | 换设备恢复 | 设备 A 登录有数据 → 设备 B 登录同一 Apple ID | B 拉回 A 的数据（`downloaded`），HP/记录一致 |
| C4 | 持续同步（G4）| 登录后改 HP/打卡 → 等 >5s | 后端快照随之更新；settings「上次同步」刷新为「刚刚」 |
| C5 | schema 不匹配 | 后端快照版本 ≠ 客户端 | 走 `schema-mismatch`，**不覆盖**两边数据 |
| C6 | 退出登录 | 点退出 | 清 `account`，本地数据保留 |
| C7 | 删除账号 | 点删除（登录态） | 后端硬删 user；本地 `resetAll()` → 回 onboarding |
| C8 | 图片恢复（已知缺口）| C3 后看体重/餐次照片 | ⚠️ 当前预期**失败**（图片未上传），除非先补 R2 上传 |

### 整体「验证通过」定义

- 客户端：阶段 A + B 全过。
- 完整功能：阶段 C 的 C1–C7 全过；C8 取决于是否决定补图片上传。

---

## 6. 下一步（架构已定为 CF Worker + D1）

域名(§待办)和架构(§已锁定)都定了。剩余顺序：

1. **Cloudflare 接管 DNS**：`flykid.xyz` NS 转 Cloudflare；建 `api.flykid.xyz` 路由。
2. **建后端工程**（新目录，建议 repo 内 `backend/` 或独立 repo）：Worker + `wrangler.toml` + D1。
3. **D1 schema（第一版从简）**：先用单表 `user_data(user_id, payload JSON, schema_version, updated_at)`
   走通整包同步（贴合现有 `sync.ts`），规范化多表（database.md 的 MealEvent/WeightLog/...）留到 v1.1。
4. **端点**：`POST /auth/apple`（校验 Apple JWKS → 签 JWT）、`/sync/push`、`/sync/pull`、
   `/auth/logout`、`DELETE /auth/me`。路径暂不加 `/v1` 以贴合客户端现状（或两边一起改）。
5. **客户端对齐**：把 `apiClient` 默认 base 指向 `https://api.flykid.xyz`；
   token 存储迁到 `expo-secure-store`；按需补 refresh 流程。
6. 跑阶段 C 端到端。
7. 决定是否补**图片上传**（CF R2），补齐 G4 备份（C8）。

### 需要用户提供 / 操作
- Cloudflare 账号（免费版即可）。
- 把 `flykid.xyz` NS 转到 Cloudflare（在 GoDaddy 改 NS）。
- Apple Developer：Service ID + Sign in with Apple Key（`.p8`）+ Team ID + Key ID，
  供 Worker 校验 Apple token / 签 JWT。

## 相关文档

- `docs/api/auth.md` — Apple 登录 + JWT 方案
- `docs/api/openapi.yaml` — API 契约
- `docs/architecture/database.md` — 服务端数据库预案（D1）

# v1.1 三件套修复计划（食物识别 / 体重 OCR / 后端云同步）

分支：`feat/stage-4-5-ui`
对应 issue：#2（食物识别） / #4 + #5（数据库 & 服务器） / 体重 OCR（口头需求，不在 issue 里）
后端目录：`/home/xin/document/mealmate/backend/`（FastAPI + YOLOv8 + SQLite，已具备 auth + /sync/push + /sync/pull）

---

## 1. Issue #2：食物识别页"识别服务没连上，餐已打卡（aborted）"

### 现状

- 前端 `app/src/services/foodDetection.ts` 默认 BASE = `http://192.168.1.157:8000`（LAN IP），可被 `EXPO_PUBLIC_DETECT_API_BASE` 覆盖。
- `app/app/(modal)/photo.tsx` 调用 `detectFood()`：失败也不阻塞打卡，UI 显示 "识别服务没连上，餐已打卡。"
- 后端 `/detect` endpoint 完整可用（GPU/cuda:0，YOLOv8n + COCO 食物类过滤），手动 `uvicorn` 拉起来 200 OK。
- **根因**：内网 IP `192.168.1.157` 在 TestFlight 用户的网络下不可达；且后端没装 systemd，重启机器就失联。

### 要做

1. **后端公网化**（用户负责路由器侧的 DDNS + 端口转发，我提供配置 checklist）
   - 后端默认端口 `8000`
   - 暴露给公网的协议：HTTP/HTTPS（iOS ATS 默认强制 HTTPS — 若只能 HTTP 要在 app.json 加 ATS 豁免，建议路由器层做 TLS 终端或上 cloudflared sidecar）
2. **后端 systemd 持久化**
   - `mealmate.service` 已在 `backend/` 里写好，需 `sudo cp` 到 `/etc/systemd/system/` + `daemon-reload` + `enable --now`
   - 我没 sudo 权限，给用户准备一行命令 + 跑通验证脚本
3. **前端默认 URL 改成公网域名**
   - 等用户提供 DDNS 域名后改 `foodDetection.ts` 的 `DEFAULT_BASE`
   - 同时支持 `EXPO_PUBLIC_DETECT_API_BASE` 覆盖（dev 时切回内网 IP 加速）
4. **失败 UI 文案优化**（次要）
   - 当前 "识别服务没连上，餐已打卡（aborted）" 里 `aborted` 是 fetch AbortController 超时的 raw 错误，对用户没意义
   - 改成根据 error 类型分两条文案：超时/网络不通 vs 服务返回非 2xx

### 验证

- TestFlight 拍照路径走通：照片 → /detect 返回 detections → result 页显示
- 后端 systemd `systemctl restart mealmate` 后服务自动起来
- 公网域名 `curl https://<域名>/health` 200

---

## 2. 体重 OCR：TestFlight 上完全挂

### 现状

- 前端 `app/src/services/weightOcr.ts` 调 Gemini 2.5 Flash Vision (`generativelanguage.googleapis.com`)
- key 通过 `EXPO_PUBLIC_GEMINI_KEY`，没 key 直接返回 null → 用户手填
- `(modal)/weight-entry.tsx` 拍照后跑 `runOcr` → 自动填 input
- 本地 dev 应该 OK（用户口述"TestFlight 上完全挂"暗示 dev 是好的）

### 可能根因（按可能性排序）

1. **`.env.local` 没被 EAS Build 注入** — TestFlight 的 IPA 是 EAS Build 生成的，`.env.local` 是 gitignored 的，构建时 EAS 看不到。要么把 secret 挂到 EAS Secrets，要么 build 命令 `--env-file`
2. **iOS ATS 限制** — Gemini 域名是 HTTPS，应该没问题，但确认下
3. **Google API 在用户的网络下被墙** — 国内运营商网络可能拦截 generativelanguage.googleapis.com
4. **失败静默吞掉** — 代码里所有 fail 都 `return null` + `__DEV__` warn，prod build 看不到任何 error，需要至少加 production-safe 的失败上报（Sentry / 后端 log endpoint）

### 要做

1. **优先确认 #1**：用户给我看 EAS Build 命令 / `eas.json` 配置，确认 GEMINI_KEY 是否进 bundle
   - 临时验证：在 weight-entry 顶部加一个开发环境标识，TestFlight 上能看到 key 长度（不打印 key 本身，只打印 `(KEY?.length ?? 0)`）
2. **加 production 失败上报**：weightOcr.ts 里 fail 时往后端打一个 `/log/ocr-failure` POST（新加 endpoint，匿名 OK）
3. **降级方案**：如果 Google API 在国内不稳，把 OCR 也搬到后端（用 backend 现有 venv 跑 PaddleOCR 或 Tesseract），weightOcr.ts 改成调 `POST /ocr/weight`
   - 这是 fallback 方案，先确认 #1/#3 哪个是真根因再决定要不要走

### 验证

- TestFlight build 上拍体重秤，OCR 能填到 input
- 失败上报能在后端日志里看到（如果走 #2 方案）

---

## 3. Issue #4 + #5：云端数据库 + 备份 + TestFlight 本地数据迁移

### 现状

**后端已完成**（`/home/xin/document/mealmate/backend/`）：
- `db.py`：SQLite，三张表 `users` / `sessions` / `user_data`（key-value payload + schema_version）
- `auth.py`：Apple Sign-In identity token 验证 + session token 签发
- `/auth/apple` `/auth/logout` `/auth/me` `/sync/push` `/sync/pull` 全部就位
- 数据备份：`backend/data/backups/` 目录已存在 + `backup.log` 有记录（用户已有备份脚本）

**前端 sync 客户端已写好**（在 `feat/weight-ocr` 的 stash 里）：
- `app/src/services/apiClient.ts`（带 token 的 fetch 包装）
- `app/src/services/auth.ts`（Apple Sign-In wrapper）
- `app/src/services/sync.ts`（push / pull / syncOnSignIn）
- `app/app/(main)/settings.tsx` 改造：登录按钮 + 同步状态显示
- `app/app/_layout.tsx`：store subscriber，5s 节流推到云端
- `app/src/store/useStore.ts`：加 `account` / `lastSyncedAt` state + actions
- `app/app.json`：`usesAppleSignIn: true` + `expo-apple-authentication` 插件
- `docs/architecture/account-sync.md` 架构文档

### 要做

1. **把 stash 应用到 `feat/stage-4-5-ui`**
   - `git stash apply` — 文件无冲突直接落地（store 形状如果在 stage-4-5-ui 上变了可能有冲突，需手解）
   - 跑 `npm run typecheck` + `npm run lint` 确认接得上
2. **校验 store schema_version 兼容**
   - feat/weight-ocr 的 store 是 v5；feat/stage-4-5-ui 上的 store 可能因为加了 stage 4/5 字段升到了 v6/v7
   - sync push 用的 schema_version 必须用当前分支的 STORE_VERSION，不是 stash 里写死的版本
3. **TestFlight 本地数据迁移**（issue #4 的核心痛点）
   - 老用户场景：登录前 store 里已有 mealHistory / weightHistory 等数据，登录后**不能被云端空 payload 覆盖**
   - sync.ts 的 `syncOnSignIn` 需要的逻辑：pull 拿到云端 payload → 如果云端有数据且 updated_at 较新 → 用云端覆盖；如果云端空 → 立即 push 一次本地数据
   - 我会读 stash 里的 sync.ts 看看现有逻辑符不符合，不符合就改
4. **后端 systemd 永久跑** + 公网可达（同 §1.2）
5. **前端 API base 配置**
   - `apiClient.ts` 同样需要 `EXPO_PUBLIC_API_BASE`（auth + sync 共用后端），默认值改成公网域名

### 验证

- 同一 Apple ID 在两个设备登录 → 数据互通
- 退出登录 + 重新登录 → 数据回来
- 卸载重装 + 登录 → 数据回来
- 离线状态点同步 → 错误提示但不崩
- 老 TestFlight 用户首次登录 → 本地数据被 push 上云，不丢

---

## 4. 执行顺序

按依赖关系：

1. **stash apply（sync 代码落地到当前分支）** — 是 §3 的前置，typecheck 过
2. **后端 systemd 装上 + 公网联调** — 是 §1、§3 的前置
3. **前端 BASE URL 改成公网域名** — 是 §1、§3 的前置
4. **修 §1 食物识别失败文案** — 小改
5. **§2 体重 OCR 排查根因 + 修** — 需要用户配合看 eas.json
6. **§3 sync 联调 + 数据迁移逻辑校对**
7. **跑 lint / typecheck，确保不破坏 stage 4/5 已有功能**

每一步做完，更新 TaskList 状态，跟用户对一下再往下走。

---

## 5. 我现在没法独立完成的事

- **路由器 DDNS + 端口转发**：需要用户在路由器后台操作，告诉我对外域名
- **sudo 操作**：安装 systemd unit、修改防火墙、装 nginx/cloudflared — 给用户准备命令清单
- **EAS Build 配置**：需要看 `eas.json`、知道当前 build profile，决定 Gemini key 放 Secret 还是 env
- **TestFlight 实测**：我能跑 `npm run ios` 在 simulator 上验，但 TestFlight 上的真问题（ATS / 国内网络）需要用户在真机上测

# MealMate Backend API

后端代码在 [`/backend/`](../backend/)。FastAPI + SQLite + YOLOv8。

Base URL：dev `http://192.168.1.157:8000`，prod 走 Cloudflare Tunnel（域名见
`docs/architecture/account-sync.md`）。

---

## 通用

- **Content-Type**: `application/json`（除 `/detect` 用 `multipart/form-data`）
- **Auth**: 需要登录的接口要带 `Authorization: Bearer <session_token>` header
- **错误**: 标准 FastAPI 422 (validation) / 401 (auth) / 400 (bad input) / 500 (server)
- **CORS**: 允许所有 origin（dev 友好；TLS 终端在 CF Tunnel 上做）

Session token 在 `/auth/apple` 拿到，sha256 哈希后存进 `sessions` 表，永不过期（生命周期 = 用户主动 logout 或 admin 删 row）。

---

## `GET /health`

健康检查，不需要 auth。

**200**
```json
{ "status": "ok", "device": "cuda:0", "model_loaded": true }
```

---

## `POST /detect`

食物识别。YOLOv8n，COCO 食物类过滤（banana / apple / sandwich / orange / broccoli / carrot / hot dog / pizza / donut / cake）。

**Request**: `multipart/form-data`
- `image`: 图片文件（JPEG / PNG / WebP），随便多大都行，模型自己 resize

**200**
```json
{
  "detections": [
    {
      "label": "pizza",
      "bbox": [102, 88, 540, 410],
      "confidence": 0.92
    }
  ],
  "model": "yolov8n",
  "inference_ms": 47.3
}
```

`detections` 可能为空数组（图里啥食物都没识别出来，前端要兜底）。
`bbox` 是 `[x1, y1, x2, y2]`（原图坐标系）。

**400**: 文件不是合法图片。

---

## `POST /auth/apple`

Apple Sign-In identity token → 签发后端 session token。

**Request**
```json
{ "identity_token": "<apple JWT>" }
```

**200**
```json
{
  "user_id": "<uuid>",
  "token": "<session_token, 43 chars urlsafe>",
  "email": "user@example.com"
}
```

`email` 可能是 null（Apple 后续登录不一定返回邮箱，第一次返回的会存进 `users.email`）。

**401**: identity token 校验失败（签名 / aud / iss 不对，或缺 `sub`）。

后端做的事：
1. 用 Apple JWKS 验签 + `aud=com.xinray.mealmate`（可改 `MEALMATE_APPLE_AUDIENCE` env）+ `iss=https://appleid.apple.com`
2. 拿 `sub` (Apple stable user ID) → `users` 表 upsert
3. 生成 32-byte urlsafe token，把 sha256 存 `sessions.token_hash`，原 token 返回客户端

---

## `POST /auth/logout`

吊销当前 session token。**幂等**，没传 token 也返回 ok。

**Request**: header `Authorization: Bearer <token>`

**200**
```json
{ "ok": true }
```

---

## `DELETE /auth/me`

注销账号。**硬删**用户行 → FK CASCADE 把 sessions + user_data 一起干掉。

**Request**: header `Authorization: Bearer <token>`（必须）

**200**
```json
{ "ok": true }
```

---

## `POST /sync/push`

整包覆盖式上传。**最后写赢**，多设备并发会丢数据（v1 接受）。

**Request**: header `Authorization: Bearer <token>` + JSON body
```json
{
  "payload": { ...整个 store 的快照... },
  "schema_version": 12
}
```

**200**
```json
{ "ok": true, "updated_at": "2026-05-30T08:23:11.234567+00:00" }
```

后端做的事：把 payload `json.dumps(ensure_ascii=False, separators=(',', ':'))`
压成字符串，UPSERT 进 `user_data`。

---

## `GET /sync/pull`

拉用户当前云端 payload。

**Request**: header `Authorization: Bearer <token>`

**200 (云端有数据)**
```json
{
  "payload": { ...上次 push 的 store 快照... },
  "schema_version": 12,
  "updated_at": "2026-05-30T08:23:11.234567+00:00"
}
```

**200 (云端空 — 新用户首次)**
```json
{ "payload": null, "schema_version": null, "updated_at": null }
```

客户端 `syncOnSignIn` 策略：
- 收到 `payload: null` → push 本地（issue #4 老用户场景）
- 收到 payload 且 `schema_version` 匹配 → apply 覆盖本地
- 收到 payload 但 `schema_version` ≠ 本地 → 跳过 apply，提示用户升级 app（不会丢数据，
  谁的版本对都不动）

---

## 计划中的（尚未实现）

### `POST /ocr/weight`

体重秤照片 → kg 数字。本地 PaddleOCR / EasyOCR 推理，替换前端当前直连
Gemini Vision（issue：TestFlight 上 Google API 不可达 + EAS env 没注入 key）。

预期形状：
```
multipart/form-data: image=<jpg>
→ 200: { "kg": 60.5, "confidence": 0.94, "inference_ms": 180.5 }
→ 200 (识别不到): { "kg": null, "confidence": 0.0, "inference_ms": 90.3 }
```

### `POST /upload/photo`

体重秤照片 / 餐次照片上传到 R2（解决 account-sync.md §3 已知缺口：
图片 URI 是本地 `file://`，换设备后照片全部失效）。

---

## 版本演进策略

- 路径**不带 `/v1` 前缀**（贴现状）。如果未来要 break change 走 `/v2/...`。
- `schema_version` 走前端 store 的 persist version，跟 backend code 解耦 ——
  后端只存不解析 payload。

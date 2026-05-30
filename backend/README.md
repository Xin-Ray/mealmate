# MealMate Backend

FastAPI + YOLOv8 + SQLite。为前端 (`../app/`) 提供：

- `POST /detect` — 食物图像识别（YOLOv8n，COCO 食物类过滤），GPU 推理
- `POST /auth/apple` — Apple Sign-In identity token 校验 + 签发 session token
- `POST /auth/logout` / `DELETE /auth/me` — 登出 / 注销
- `POST /sync/push` / `GET /sync/pull` — 整包 JSON 同步（key-value，最后写赢）
- `GET /health` — 健康检查

完整 API 契约见 `../docs/api.md`。

---

## 目录结构

```
backend/
├── app/
│   ├── __init__.py        # Python 包标识
│   ├── main.py            # FastAPI 入口（uvicorn app.main:app）
│   ├── auth.py            # Apple JWT 校验 + session token
│   ├── db.py              # SQLite schema + connection 管理
│   └── detector.py        # YOLOv8 封装 + 食物类过滤
├── data/                  # 运行时数据（.gitignored，首次 init_db 自动创建）
│   ├── mealmate.db
│   └── backups/
├── models/
│   └── yolov8n.pt         # YOLO 权重（6MB，跟 repo 走）
├── samples/               # 测试图片
├── scripts/
│   └── backup.sh          # SQLite 在线备份脚本（cron 用）
├── tests/
│   └── test_detect.py
├── requirements.txt
├── .env.example
└── mealmate.service       # systemd unit（生产）
```

---

## 启动

### 首次安装

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
# torch 必须先单独装 cu121 wheel —— 见 requirements.txt 顶部注释
.venv/bin/pip install torch==2.3.1 torchvision==0.18.1 \
  --index-url https://download.pytorch.org/whl/cu121
.venv/bin/pip install -r requirements.txt

cp .env.example .env  # 按需修改
```

### dev 启动

```bash
cd backend
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### prod (systemd)

```bash
sudo cp mealmate.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mealmate
systemctl status mealmate
journalctl -u mealmate -f
```

### 测试

```bash
cd backend
.venv/bin/pytest tests/
```

---

## 数据库

SQLite (`data/mealmate.db`)，三张表：

- `users(id, apple_sub, email, created_at, updated_at)`
- `sessions(token_hash, user_id, created_at, last_used_at)` — bearer token 的 sha256
- `user_data(user_id, payload TEXT, schema_version, updated_at)` — 整个 store 的 JSON blob

### 备份

`scripts/backup.sh` 用 sqlite3 `.backup` 命令做热备份，保留 14 天。挂 cron：

```cron
0 4 * * * /home/xin/document/mealmate-app/backend/scripts/backup.sh
```

备份落 `data/backups/mealmate-<ts>.db.gz`。

---

## 跟前端的 schema_version 协议

前端 `app/src/services/sync.ts` 里 `SYNC_SCHEMA_VERSION` 必须 = 客户端 store version。
后端**不验证** schema，存进 `user_data.schema_version` 字段；客户端 pull 后
对比本地 version，不一致就走 `schema-mismatch` 流程，**不覆盖**两边数据。

---

## TODO

- 体重秤 OCR endpoint（issue：TestFlight 上挂）：本地 PaddleOCR / EasyOCR，
  `POST /ocr/weight`，输入图，输出 `{ kg: number | null, confidence }`。
  替换前端当前直连 Gemini Vision 的路径。
- 公网化（Cloudflare Tunnel）：见 `../docs/issue-fix-plan-v1.1.md` §6.3

from __future__ import annotations

from io import BytesIO
from typing import Optional

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

from .auth import (
    delete_user,
    issue_session_token,
    require_user,
    revoke_all_for_user,
    revoke_token,
    upsert_user_by_apple,
    verify_apple_identity_token,
)
from .db import get_conn, init_db, now_iso
from .detector import food_classifier
from .ocr import weight_ocr

app = FastAPI(title="MealMate Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

init_db()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "device": food_classifier.device,
        "model_loaded": True,
        "model": food_classifier.model_name,
        "threshold_high": food_classifier.threshold_high,
        "threshold_low": food_classifier.threshold_low,
    }


@app.post("/detect")
async def detect(image: UploadFile = File(...)) -> dict:
    """v1.1.2: Food-101 classifier。

    返回:
      is_food (bool)        — 是否判定为食物 (基于 confidence 阈值)
      food_label (str|null) — 中文食物名 ("炒饭" / "披萨" / "美食" 兜底 / None 当 !is_food)
      confidence (float)    — top-1 confidence (0-1)
      top_predictions       — [{label, label_en, confidence}] top-K 候选
      detections            — v1.0 兼容字段，扁平化 [{label, confidence}]
      model                 — 模型 ID
      inference_ms (float)
    """
    raw = await image.read()
    try:
        img = Image.open(BytesIO(raw)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="invalid image file")

    is_food, food_label, confidence, top_preds, inference_ms = food_classifier.classify(img)

    # v1.0 兼容：旧前端 (未升级到 v1.1.2 contract) 至少能拿到 detections 数组
    detections = [
        {"label": p["label"], "confidence": p["confidence"]} for p in top_preds
    ]

    return {
        "is_food": is_food,
        "food_label": food_label,
        "confidence": round(confidence, 4),
        "top_predictions": top_preds,
        "detections": detections,
        "model": food_classifier.model_name,
        "inference_ms": round(inference_ms, 2),
    }


@app.post("/ocr/weight")
async def ocr_weight(image: UploadFile = File(...)) -> dict:
    """体重秤照片 → kg。无识别结果时 kg=null，客户端回退到手填。"""
    raw = await image.read()
    try:
        img = Image.open(BytesIO(raw)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="invalid image file")

    kg, confidence, raw_text, inference_ms = weight_ocr.recognize(img)
    return {
        "kg": kg,
        "confidence": round(confidence, 4),
        "raw_text": raw_text,
        "inference_ms": round(inference_ms, 2),
    }


# ---------- Auth ----------


class AppleAuthBody(BaseModel):
    identity_token: str


class AuthResponse(BaseModel):
    user_id: str
    token: str
    email: Optional[str] = None


@app.post("/auth/apple", response_model=AuthResponse)
def auth_apple(body: AppleAuthBody) -> AuthResponse:
    claims = verify_apple_identity_token(body.identity_token)
    apple_sub = claims["sub"]
    email = claims.get("email")
    user_id = upsert_user_by_apple(apple_sub, email)
    token = issue_session_token(user_id)
    return AuthResponse(user_id=user_id, token=token, email=email)


@app.post("/auth/logout")
def auth_logout(authorization: Optional[str] = Header(default=None)) -> dict:
    if authorization and authorization.lower().startswith("bearer "):
        revoke_token(authorization.split(" ", 1)[1].strip())
    return {"ok": True}


@app.delete("/auth/me")
def auth_delete_me(user_id: str = Depends(require_user)) -> dict:
    revoke_all_for_user(user_id)
    delete_user(user_id)
    return {"ok": True}


# ---------- Sync ----------


class SyncPushBody(BaseModel):
    payload: dict
    schema_version: int


class SyncPullResponse(BaseModel):
    payload: Optional[dict] = None
    schema_version: Optional[int] = None
    updated_at: Optional[str] = None


@app.post("/sync/push")
def sync_push(body: SyncPushBody, user_id: str = Depends(require_user)) -> dict:
    import json

    payload_json = json.dumps(body.payload, ensure_ascii=False, separators=(",", ":"))
    ts = now_iso()
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO user_data (user_id, payload, schema_version, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              payload = excluded.payload,
              schema_version = excluded.schema_version,
              updated_at = excluded.updated_at
            """,
            (user_id, payload_json, body.schema_version, ts),
        )
    return {"ok": True, "updated_at": ts}


@app.get("/sync/pull", response_model=SyncPullResponse)
def sync_pull(user_id: str = Depends(require_user)) -> SyncPullResponse:
    import json

    with get_conn() as conn:
        row = conn.execute(
            "SELECT payload, schema_version, updated_at FROM user_data WHERE user_id = ?",
            (user_id,),
        ).fetchone()
    if not row:
        return SyncPullResponse()
    return SyncPullResponse(
        payload=json.loads(row["payload"]),
        schema_version=row["schema_version"],
        updated_at=row["updated_at"],
    )

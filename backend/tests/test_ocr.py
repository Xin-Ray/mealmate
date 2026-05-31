from __future__ import annotations

from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app import ocr as ocr_module

client = TestClient(app)


def _jpeg(image: Image.Image) -> BytesIO:
    buf = BytesIO()
    image.save(buf, format="JPEG")
    buf.seek(0)
    return buf


def test_ocr_weight_rejects_non_image() -> None:
    r = client.post(
        "/ocr/weight",
        files={"image": ("bad.jpg", b"not an image", "image/jpeg")},
    )
    assert r.status_code == 400


def test_ocr_weight_returns_null_when_recognize_returns_none(monkeypatch) -> None:
    # 不真打 Gemini API，mock recognize 让它返回"识别不到"
    monkeypatch.setattr(
        ocr_module.weight_ocr,
        "recognize",
        lambda img: (None, 0.0, "unknown", 42.0),
    )
    blank = Image.new("RGB", (400, 200), "white")
    r = client.post("/ocr/weight", files={"image": ("blank.jpg", _jpeg(blank), "image/jpeg")})
    assert r.status_code == 200
    body = r.json()
    assert body["kg"] is None
    assert body["confidence"] == 0.0
    assert body["raw_text"] == "unknown"


def test_ocr_weight_passes_through_kg_from_recognize(monkeypatch) -> None:
    monkeypatch.setattr(
        ocr_module.weight_ocr,
        "recognize",
        lambda img: (60.5, 0.95, "60.5", 123.0),
    )
    img = Image.new("RGB", (400, 200), "white")
    r = client.post("/ocr/weight", files={"image": ("scale.jpg", _jpeg(img), "image/jpeg")})
    assert r.status_code == 200
    body = r.json()
    assert body["kg"] == 60.5
    assert body["confidence"] == 0.95
    assert body["raw_text"] == "60.5"
    assert body["inference_ms"] == 123.0

from __future__ import annotations

from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def _jpeg_bytes(color: str = "white", size: tuple[int, int] = (640, 480)) -> BytesIO:
    img = Image.new("RGB", size, color=color)
    buf = BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf


def test_health() -> None:
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert body["device"] in {"cpu"} or body["device"].startswith("cuda")


def test_detect_blank_image_returns_empty_list() -> None:
    buf = _jpeg_bytes()
    r = client.post("/detect", files={"image": ("blank.jpg", buf, "image/jpeg")})
    assert r.status_code == 200
    body = r.json()
    assert body["detections"] == []
    assert body["model"] == "yolov8n"
    assert isinstance(body["inference_ms"], (int, float))


def test_detect_rejects_non_image() -> None:
    r = client.post(
        "/detect",
        files={"image": ("bad.jpg", b"not an image", "image/jpeg")},
    )
    assert r.status_code == 400

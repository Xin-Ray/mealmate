from __future__ import annotations

from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont

from app.main import app

client = TestClient(app)


def _jpeg(image: Image.Image) -> BytesIO:
    buf = BytesIO()
    image.save(buf, format="JPEG")
    buf.seek(0)
    return buf


def _text_image(text: str, size: tuple[int, int] = (400, 200)) -> Image.Image:
    img = Image.new("RGB", size, "white")
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 80)
    except Exception:
        font = ImageFont.load_default()
    d.text((60, 50), text, fill="black", font=font)
    return img


def test_ocr_weight_blank_image_returns_null_kg() -> None:
    blank = Image.new("RGB", (400, 200), "white")
    r = client.post("/ocr/weight", files={"image": ("blank.jpg", _jpeg(blank), "image/jpeg")})
    assert r.status_code == 200
    body = r.json()
    assert body["kg"] is None
    assert body["confidence"] == 0.0
    assert isinstance(body["inference_ms"], (int, float))


def test_ocr_weight_rejects_non_image() -> None:
    r = client.post(
        "/ocr/weight",
        files={"image": ("bad.jpg", b"not an image", "image/jpeg")},
    )
    assert r.status_code == 400


def test_ocr_weight_reads_synthetic_60_5_kg() -> None:
    img = _text_image("60.5 kg")
    r = client.post("/ocr/weight", files={"image": ("scale.jpg", _jpeg(img), "image/jpeg")})
    assert r.status_code == 200
    body = r.json()
    assert body["kg"] == 60.5
    # EasyOCR 对清晰印刷字体 conf 接近 1
    assert body["confidence"] > 0.5


def test_ocr_weight_ignores_numbers_out_of_range() -> None:
    # 5 不在 20–250 范围 → kg=null
    img = _text_image("5")
    r = client.post("/ocr/weight", files={"image": ("scale.jpg", _jpeg(img), "image/jpeg")})
    body = r.json()
    assert body["kg"] is None

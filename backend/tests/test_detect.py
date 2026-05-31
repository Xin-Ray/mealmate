"""单测 /detect 端点 + FoodClassifier 的三段 confidence band。

不依赖真的 ViT 权重（pytest 跑 CI 不下 350MB 模型）—— 把
FoodClassifier._pipeline 替换成 stub callable，模拟 HF pipeline 返回
[{"label": ..., "score": ...}] 结构。
"""
from __future__ import annotations

from io import BytesIO
from typing import Callable, Sequence

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.detector import food_classifier
from app.food_labels_zh import zh_label
from app.main import app


client = TestClient(app)


def _jpeg_bytes(color: str = "white", size: tuple[int, int] = (640, 480)) -> BytesIO:
    img = Image.new("RGB", size, color=color)
    buf = BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf


def _make_pipeline_stub(preds: Sequence[dict]) -> Callable:
    """造一个 callable 替换 food_classifier._pipeline。

    HF image-classification pipeline 输出: [{"label": str, "score": float}, ...]
    """

    def _stub(image, **kwargs):
        return list(preds)

    return _stub


@pytest.fixture
def stub_pipeline(monkeypatch):
    """绑定 stub 到 food_classifier，每个用例独立设 preds。

    返回 setter，调用 setter(preds) 注入这次测试用的预测结果。
    """

    def _set(preds: Sequence[dict]) -> None:
        monkeypatch.setattr(food_classifier, "_pipeline", _make_pipeline_stub(preds))

    yield _set

    # 测试间清理，避免 pipeline 状态在用例之间穿越
    monkeypatch.setattr(food_classifier, "_pipeline", None)


# ----- zh mapping unit tests -----


def test_zh_label_maps_known() -> None:
    assert zh_label("fried_rice") == "炒饭"
    assert zh_label("pizza") == "披萨"
    assert zh_label("pho") == "越南河粉"
    assert zh_label("sushi") == "寿司"


def test_zh_label_falls_back_to_english() -> None:
    assert zh_label("not_a_real_label") == "not_a_real_label"
    assert zh_label("") == ""


# ----- /health endpoint -----


def test_health_includes_thresholds_and_model() -> None:
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert body["model"] == "nateraw/food"
    assert 0.0 < body["threshold_low"] <= body["threshold_high"] <= 1.0
    assert body["device"] in {"cpu"} or body["device"].startswith("cuda")


# ----- /detect contract -----


def test_detect_high_confidence_returns_specific_food(stub_pipeline) -> None:
    """top-1 >= 0.5 → is_food=true, food_label= 具体中文名"""
    stub_pipeline([
        {"label": "fried_rice", "score": 0.87},
        {"label": "spaghetti_carbonara", "score": 0.05},
        {"label": "ramen", "score": 0.03},
    ])
    buf = _jpeg_bytes()
    r = client.post("/detect", files={"image": ("rice.jpg", buf, "image/jpeg")})
    assert r.status_code == 200
    body = r.json()
    assert body["is_food"] is True
    assert body["food_label"] == "炒饭"
    assert body["confidence"] == 0.87
    assert body["model"] == "nateraw/food"
    assert body["top_predictions"][0] == {
        "label": "炒饭",
        "label_en": "fried_rice",
        "confidence": 0.87,
    }
    assert body["detections"][0] == {"label": "炒饭", "confidence": 0.87}


def test_detect_medium_confidence_falls_back_to_generic(stub_pipeline) -> None:
    """top-1 ∈ [0.15, 0.5) → is_food=true, food_label='美食' 兜底"""
    stub_pipeline([
        {"label": "fried_rice", "score": 0.30},
        {"label": "pad_thai", "score": 0.20},
        {"label": "ramen", "score": 0.10},
    ])
    buf = _jpeg_bytes()
    r = client.post("/detect", files={"image": ("blurry.jpg", buf, "image/jpeg")})
    assert r.status_code == 200
    body = r.json()
    assert body["is_food"] is True
    assert body["food_label"] == "美食"
    assert body["confidence"] == 0.30


def test_detect_low_confidence_rejected_as_non_food(stub_pipeline) -> None:
    """top-1 < 0.15 → is_food=false, food_label=null"""
    stub_pipeline([
        {"label": "pizza", "score": 0.08},
        {"label": "hamburger", "score": 0.06},
        {"label": "french_fries", "score": 0.05},
    ])
    buf = _jpeg_bytes()
    r = client.post("/detect", files={"image": ("keyboard.jpg", buf, "image/jpeg")})
    assert r.status_code == 200
    body = r.json()
    assert body["is_food"] is False
    assert body["food_label"] is None
    assert body["confidence"] == 0.08
    assert len(body["top_predictions"]) == 3


def test_detect_rejects_non_image() -> None:
    r = client.post(
        "/detect",
        files={"image": ("bad.jpg", b"not an image", "image/jpeg")},
    )
    assert r.status_code == 400


def test_detect_threshold_band_boundaries(stub_pipeline) -> None:
    """正好等于阈值 → 算 specific（HIGH 边界）/ generic（LOW 边界）"""
    stub_pipeline([{"label": "pizza", "score": 0.50}])
    r = client.post("/detect", files={"image": ("a.jpg", _jpeg_bytes(), "image/jpeg")})
    assert r.json()["food_label"] == "披萨"

    stub_pipeline([{"label": "pizza", "score": 0.15}])
    r = client.post("/detect", files={"image": ("b.jpg", _jpeg_bytes(), "image/jpeg")})
    assert r.json()["food_label"] == "美食"

    stub_pipeline([{"label": "pizza", "score": 0.14}])
    r = client.post("/detect", files={"image": ("c.jpg", _jpeg_bytes(), "image/jpeg")})
    assert r.json()["is_food"] is False

"""食物识别 — Food-101 classifier（HF nateraw/food, ViT-base）。

v1.1.2 起替换 v1.0 的 YOLOv8 + COCO 10 类 filter。原方案问题：
COCO 数据集只标注 banana/apple/sandwich/pizza/orange/broccoli/carrot/
hot_dog/donut/cake 这 10 个食物类，大多数中餐（米饭/面条/汤/炒菜）
被一律拒绝识别。

新方案是 image-classification 而不是 object-detection：
  输入整张图 → 101 类 softmax → top-K 候选 + confidence
  按 confidence band 决定是否算"食物"：
    top-1 >= FOOD_THRESHOLD_HIGH (0.5)         → 高信心，标具体中文名
    top-1 in [FOOD_THRESHOLD_LOW (0.15), HIGH) → 是食物但不确定，标 "美食" 兜底
    top-1 < LOW                                → 不是食物，UI 拒绝打卡

阈值通过 env 调（FOOD_THRESHOLD_HIGH / FOOD_THRESHOLD_LOW），默认 0.5/0.15。

模型懒加载（首次调用时拉权重到 ~/.cache/huggingface/，约 350MB ViT-base）—
避免 uvicorn import 阶段就锁住 GPU 显存。
"""

from __future__ import annotations

import os
from threading import Lock
from time import perf_counter
from typing import Optional

import torch
from PIL import Image

from .food_labels_zh import zh_label

_DEFAULT_MODEL = "nateraw/food"
_TOP_K = 3
_GENERIC_LABEL_ZH = "美食"


def _read_threshold(name: str, default: float) -> float:
    """读 env 阈值，无效值 fallback 到 default（不抛错让 uvicorn 起不来）。"""
    try:
        return float(os.environ.get(name, str(default)))
    except (TypeError, ValueError):
        return default


class FoodClassifier:
    def __init__(self, model_name: str = _DEFAULT_MODEL) -> None:
        self._pipeline = None
        self._lock = Lock()
        self.model_name = model_name
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.threshold_high = _read_threshold("FOOD_THRESHOLD_HIGH", 0.5)
        self.threshold_low = _read_threshold("FOOD_THRESHOLD_LOW", 0.15)

    def _ensure_pipeline(self):
        if self._pipeline is not None:
            return self._pipeline
        with self._lock:
            if self._pipeline is None:
                # 延迟 import 让模块 import 时不重，方便单测 mock _pipeline
                from transformers import pipeline as hf_pipeline

                self._pipeline = hf_pipeline(
                    "image-classification",
                    model=self.model_name,
                    device=0 if torch.cuda.is_available() else -1,
                    top_k=_TOP_K,
                )
        return self._pipeline

    def classify(
        self,
        image: Image.Image,
    ) -> tuple[bool, Optional[str], float, list[dict], float]:
        """图像 → (is_food, food_label, confidence, top_predictions, inference_ms)。

        food_label 为中文：confidence >= HIGH → 具体名；[LOW, HIGH) → "美食"；< LOW → None
        top_predictions: 前 _TOP_K 个，每项 {label, label_en, confidence}
        """
        pipeline = self._ensure_pipeline()

        start = perf_counter()
        raw_preds = pipeline(image)
        inference_ms = (perf_counter() - start) * 1000.0

        # raw_preds = [{"label": "fried_rice", "score": 0.87}, ...]，已按 score 降序
        top_preds: list[dict] = [
            {
                "label": zh_label(str(p["label"])),
                "label_en": str(p["label"]),
                "confidence": round(float(p["score"]), 4),
            }
            for p in raw_preds[:_TOP_K]
        ]

        if not top_preds:
            return False, None, 0.0, [], inference_ms

        top1_conf = top_preds[0]["confidence"]
        if top1_conf >= self.threshold_high:
            return True, top_preds[0]["label"], top1_conf, top_preds, inference_ms
        if top1_conf >= self.threshold_low:
            return True, _GENERIC_LABEL_ZH, top1_conf, top_preds, inference_ms
        return False, None, top1_conf, top_preds, inference_ms


# 模块级单例（uvicorn worker 进程内共享）
food_classifier = FoodClassifier()

"""体重秤 OCR。

替换前端原来直连 Gemini Vision 的路径 —— Gemini API 在国内 / TestFlight 上
不稳定，迁到后端用 EasyOCR 自己跑，跟食物识别同一台 GPU。

策略：
- EasyOCR 单例 (gpu=True 跑 cuda)，首次 lazy 初始化（避免 import 时阻塞 uvicorn）
- 接受 PIL Image，返回最可信的 20–250 kg 范围内数字，否则返回 None
- 体重秤 LCD 数字可能带 "kg" 后缀或小数点；提取规则只看数字本身
- 多个候选时取 confidence 最高的
"""

from __future__ import annotations

import logging
import re
from threading import Lock
from time import perf_counter
from typing import Optional

import numpy as np
import torch
from PIL import Image

logger = logging.getLogger("mealmate.ocr")
logger.setLevel(logging.INFO)
if not logger.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter("[ocr] %(message)s"))
    logger.addHandler(_h)

# 数字 + 可选小数（最多 1 位）。覆盖 "60", "60.5", ".5"(异常但容忍)；不接受 "1,234"。
_NUM_RE = re.compile(r"(\d{1,3}(?:\.\d{1,2})?|\.\d{1,2})")

_KG_MIN = 20.0
_KG_MAX = 250.0


class WeightOcr:
    def __init__(self) -> None:
        self._reader = None
        self._lock = Lock()
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"

    def _ensure_reader(self):
        # 首次调用时初始化（避免 uvicorn import 阶段就把 80MB 模型加载到显存）
        if self._reader is not None:
            return self._reader
        with self._lock:
            if self._reader is None:
                # 延迟 import 让模块本身 import 时不重，方便单测 mock
                import easyocr

                self._reader = easyocr.Reader(
                    ["en"],
                    gpu=torch.cuda.is_available(),
                    verbose=False,
                )
        return self._reader

    def recognize(
        self,
        image: Image.Image,
    ) -> tuple[Optional[float], float, str, float]:
        """返回 (kg, confidence, raw_text, inference_ms)。

        kg=None 表示没识别到合理体重；客户端应当回退到手填。
        """
        reader = self._ensure_reader()
        arr = np.array(image.convert("RGB"))

        start = perf_counter()
        # readtext returns list[(bbox, text, confidence)]
        items = reader.readtext(arr)
        inference_ms = (perf_counter() - start) * 1000.0

        raw_joined = " ".join(str(t) for _, t, _ in items)

        best: tuple[float, float] | None = None  # (kg, confidence)
        for _, text, conf in items:
            for m in _NUM_RE.finditer(str(text)):
                try:
                    kg = float(m.group(0))
                except ValueError:
                    continue
                if not (_KG_MIN <= kg <= _KG_MAX):
                    continue
                # 容忍模型偶尔把整数 "605" 当 "60.5" 漏掉小数点 — 不主动修正，
                # 让客户端 UI 给用户校对的机会
                if best is None or float(conf) > best[1]:
                    best = (round(kg, 1), float(conf))

        # 把每次识别的原始候选都打到 journal，便于排查"识别不出来"的真实原因
        items_dump = "; ".join(f"{t!r}={conf:.2f}" for _, t, conf in items)
        if best is None:
            logger.info(
                "no kg matched. items=[%s] raw=%r inference=%.0fms image=%dx%d",
                items_dump, raw_joined, inference_ms, image.width, image.height,
            )
            return None, 0.0, raw_joined, inference_ms
        logger.info(
            "kg=%.1f conf=%.3f raw=%r inference=%.0fms",
            best[0], best[1], raw_joined, inference_ms,
        )
        return best[0], best[1], raw_joined, inference_ms


# 模块级单例（uvicorn worker 进程内共享）
weight_ocr = WeightOcr()

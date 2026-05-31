"""体重秤 OCR — 调 Gemini 2.5 Flash Vision。

v1.1 前用 EasyOCR (CRNN)，对真实 LCD 7 段数字识别效果差。改成走 Gemini
Vision API：理解能力更强，能处理反光 / 倾斜 / 模糊 / 屏幕摩尔纹。

API key 在 backend 环境变量 `GEMINI_API_KEY`，**不进客户端 bundle**（前端
仍调 /ocr/weight 不变；key 也不再依赖 EXPO_PUBLIC_GEMINI_KEY）。

策略：
- 接受 PIL Image，转 base64 (JPEG) 发给 Gemini
- prompt 严格要求：只输出一个数字（保留 1 位小数），看不清/不是秤面 → unknown
- 数字范围 20–250 kg 校验，超范围当 None
- 网络 / 模型异常都返回 None，客户端回退手填
- 没有 confidence 概念（LLM 不返），用固定 0.95 表示"识别到了"
"""

from __future__ import annotations

import base64
import logging
import os
import re
from io import BytesIO
from time import perf_counter
from typing import Optional

import httpx
from PIL import Image

logger = logging.getLogger("mealmate.ocr")
logger.setLevel(logging.INFO)
if not logger.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter("[ocr] %(message)s"))
    logger.addHandler(_h)


_NUM_RE = re.compile(r"-?\d+(?:\.\d+)?")
_KG_MIN = 20.0
_KG_MAX = 250.0

_GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
_GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{_GEMINI_MODEL}:generateContent"
)

_PROMPT = """这是一张体重秤的照片。请读取秤面上显示的体重数字（单位 kg）。
只输出一个数字，保留 1 位小数，不要单位，不要任何其他文字。
- 如果秤面模糊、看不清、或这张照片明显不是体重秤，输出 unknown。
- 数字应该在 20–250 之间，超出这个范围也输出 unknown。
示例输出：60.5"""


class WeightOcr:
    """轻量包装。无状态，每次调用直接发 Gemini API。"""

    def __init__(self) -> None:
        self._key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not self._key:
            logger.warning(
                "GEMINI_API_KEY not set; /ocr/weight will always return null"
            )

    def recognize(
        self,
        image: Image.Image,
    ) -> tuple[Optional[float], float, str, float]:
        """返回 (kg, confidence, raw_text, inference_ms)。

        kg=None 表示没识别到合理体重；客户端应当回退到手填。
        """
        if not self._key:
            return None, 0.0, "(no GEMINI_API_KEY)", 0.0

        # JPEG 压一下：Gemini 输入按 token 计费 + 网络上传也更快
        buf = BytesIO()
        image.convert("RGB").save(buf, format="JPEG", quality=85)
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")

        body = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": _PROMPT},
                        {"inline_data": {"mime_type": "image/jpeg", "data": b64}},
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0,
                # Gemini 2.5 Flash 有 thinking tokens，限制太低会把思考过程吃完
                # 没空间输出真答案。给 200 够它思考完 + 输出 "60.5" 这种 4 字符
                "maxOutputTokens": 200,
                # 关掉 thinking 让响应直接 + 更快 + 更便宜（OCR 任务不需要推理）
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }

        start = perf_counter()
        try:
            r = httpx.post(
                _GEMINI_ENDPOINT,
                params={"key": self._key},
                json=body,
                timeout=20.0,
            )
        except httpx.HTTPError as e:
            inference_ms = (perf_counter() - start) * 1000.0
            logger.warning("gemini network error: %s (%.0fms)", e, inference_ms)
            return None, 0.0, f"(network error: {e})", inference_ms

        inference_ms = (perf_counter() - start) * 1000.0

        if r.status_code != 200:
            snippet = r.text[:300] if r.text else "(no body)"
            logger.warning(
                "gemini HTTP %d (%.0fms): %s", r.status_code, inference_ms, snippet
            )
            return None, 0.0, f"(HTTP {r.status_code})", inference_ms

        j = r.json()
        text = ""
        try:
            text = j["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError):
            logger.warning(
                "gemini response missing text (%.0fms): %s",
                inference_ms,
                str(j)[:300],
            )
            return None, 0.0, "(missing text)", inference_ms

        cleaned = text.strip().lower()
        if cleaned in ("unknown", ""):
            logger.info("gemini: unknown (%.0fms) raw=%r", inference_ms, text)
            return None, 0.0, text, inference_ms

        m = _NUM_RE.search(cleaned)
        if not m:
            logger.info("gemini: no number in %r (%.0fms)", text, inference_ms)
            return None, 0.0, text, inference_ms

        try:
            kg = float(m.group(0))
        except ValueError:
            return None, 0.0, text, inference_ms

        if not (_KG_MIN <= kg <= _KG_MAX):
            logger.info(
                "gemini: out of range kg=%s raw=%r (%.0fms)",
                kg, text, inference_ms,
            )
            return None, 0.0, text, inference_ms

        kg_rounded = round(kg, 1)
        # LLM 没有 token-level confidence；模型已经过 prompt 约束 + 范围校验，
        # 固定一个高 confidence 表示"识别成功"，客户端不依赖具体值
        logger.info("gemini ok kg=%.1f raw=%r (%.0fms)", kg_rounded, text, inference_ms)
        return kg_rounded, 0.95, text, inference_ms


# 模块级单例（uvicorn worker 进程内共享）
weight_ocr = WeightOcr()

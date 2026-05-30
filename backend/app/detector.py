from __future__ import annotations

from pathlib import Path
from time import perf_counter

import torch
from PIL import Image
from ultralytics import YOLO

# backend/ 根目录（monorepo: app/detector.py 在 backend/app/detector.py，两级上去就是 backend/）
BACKEND_DIR = Path(__file__).resolve().parent.parent

DEFAULT_WEIGHTS = BACKEND_DIR / "models" / "yolov8n.pt"

# COCO 预训练里能用的食物类别。微调后的模型如果包含更多类，
# 把 food_labels 传成 None 即可关闭过滤。
COCO_FOOD_LABELS: frozenset[str] = frozenset({
    "banana", "apple", "sandwich", "orange", "broccoli",
    "carrot", "hot dog", "pizza", "donut", "cake",
})


class FoodDetector:
    def __init__(
        self,
        weights: Path = DEFAULT_WEIGHTS,
        device: str | None = None,
        food_labels: frozenset[str] | None = COCO_FOOD_LABELS,
    ) -> None:
        self.device = device or ("cuda:0" if torch.cuda.is_available() else "cpu")
        self.model = YOLO(str(weights))
        self.model.to(self.device)
        self.weights_name = Path(weights).stem
        self.food_labels = food_labels
        self.names: dict[int, str] = self.model.names

    def detect(
        self,
        image: Image.Image,
        conf: float = 0.25,
    ) -> tuple[list[dict], float]:
        start = perf_counter()
        results = self.model.predict(
            image, conf=conf, device=self.device, verbose=False
        )
        inference_ms = (perf_counter() - start) * 1000.0

        detections: list[dict] = []
        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue
            for cls_t, conf_t, xyxy_t in zip(boxes.cls, boxes.conf, boxes.xyxy):
                label = self.names[int(cls_t.item())]
                if self.food_labels is not None and label not in self.food_labels:
                    continue
                x1, y1, x2, y2 = (float(v) for v in xyxy_t.tolist())
                detections.append({
                    "label": label,
                    "bbox": [round(x1), round(y1), round(x2), round(y2)],
                    "confidence": round(float(conf_t.item()), 4),
                })

        return detections, inference_ms

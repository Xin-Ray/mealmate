# ADR-0007：YOLO 自建食物识别后端

- 日期：2025-09
- 状态：accepted（v0.5）
- 决策人：xin

## 背景

mealmate 拍餐后要识别食物（"米饭 / 蔬菜 / 肉"），在 result phase 显示 chips。识别**不影响打卡核心流程**（fail-soft）—— 只是加分项。

候选方案：
1. **客户端模型**：TFLite / Core ML 跑本地
2. **Gemini Vision**：跟 LLM 一个 API
3. **自建 YOLO**：自己训 + 部署

## 决策

**自建 YOLOv8 + FastAPI 后端**，部署在 xin 个人服务器（默认 `http://192.168.1.157:8000`，可配 endpoint）。

## 理由

- **本地模型 (TFLite)**：
  - .ipa 增大几十 MB
  - 推理慢（iPhone 12+ 大概 200-500ms，老机更慢）
  - 模型精度有限，中餐识别不好
- **Gemini Vision**：
  - 已经用它做 OCR，复用免一次集成
  - 但**贵**：每张图 vs 一次 LLM 调用计费
  - 准确度好但 overkill
- **自建 YOLO**：
  - 自有模型 → 可针对中餐微调
  - GPU 服务器一次性投入，使用免费
  - 推理快（GPU < 100ms）
  - **fail-soft** 设计 → 服务挂不影响核心
  - 学习意义（xin 个人技术成长）

## 实现

- **模型**：YOLOv8s（small 版本，速度 / 精度平衡），基于 COCO 微调 + 自标几百张中餐
- **框架**：FastAPI（Python 3.11）
- **部署**：个人 VPS 或 xin 家用 GPU 机器
- **接口**：`POST /detect` 多部分上传图，返 `{ detections: [{label, confidence, bbox?}] }`
- **超时**：客户端 12s AbortController，超时 fallback 无 chips
- **图片大小**：客户端 expo-image-manipulator 压到 720px 长边

## 取舍

接受的：
- xin 个人服务器维护成本（每月几十刀 GPU）
- 单点风险（机器宕机用户没识别）→ fail-soft 兜底
- 模型质量 v0.5 还粗糙（标注数据少）→ 持续迭代

放弃的：
- 客户端推理的"离线可用"
- Gemini Vision 的开箱即用 + 高精度

## fail-soft 设计

```ts
try {
  const detections = await detectFood(imageUri, { timeout: 12000 });
  setDetections(detections);
} catch (error) {
  setDetectError(error.message);
  // markMealDone 已同步跑过，HP +5 / dialogue 都正常
}
```

result 屏：
- 有 detections → chips 显示
- 没 detections / detectError → 显示"识别服务没连上，餐已打卡。"提示

## v0.6+ 计划

- 模型继续微调（用户实际拍的图反向标注 + 训练）
- 迁 Cloudflare R2 + 远端推理服务（不再依赖 xin 家用机）
- 加 token-based auth 防滥用
- 加 detection caching（同图复用 result）

## 后果

- v0.5 chips 在 demo / 内测时工作，识别质量给"哇这识别出来了"的小惊喜
- xin 本地 IP 限定环境下能跑（默认 endpoint 192.168.1.157）
- 外网测试需 `EXPO_PUBLIC_DETECT_API_BASE` 改成公网地址
- xin 维护成本 = 1-2h/月

## 相关

- [05-api/api-guide.md](../05-api/api-guide.md)
- [03-modules/photo.md](../03-modules/photo.md)
- [02-business-flows/meal-photo.md](../02-business-flows/meal-photo.md)

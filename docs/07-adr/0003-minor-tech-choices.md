# ADR-0003：次要技术选型合集

- 日期：2025-08 ~ 2025-10
- 状态：accepted
- 决策人：xin

不算"重大不可逆"的技术选型合在这里，每个一段。重大决策见 0001 / 0002 / 0005。

## Zustand v5 + persist（vs Redux / Context / Jotai）

API 极简、3KB gzip、persist 中间件官方支持 AsyncStorage + version + migrate。Context 性能差 + 类型推导差；Redux 模板代码过重；Jotai 原子化对 mealmate 强相关状态反而碎。约定**所有写经 action**（addHp 等内部 clamp + 触发 advance/demote），不直接 set。schema migrate v1→v9 在 useStore.ts。

## HP 0-100 + 4 段视觉 + 经济模型

- 范围 [0,100]，视觉 4 段心（每段 25 HP）
- 餐 +5 / 错过 -10（gentle -5）/ 加餐 +10 / 体重 +0.5
- 满 100 → advanceStage（hp 重置 50，companionLv+1）
- < 0 → demoteStage（hp=90 大幅回血，避免再陷入负面感）
- stage 1 init HP=60（缓启），stage 2+ init 50
- gentle mode 不追溯，只影响未来扣分
- 单次 |delta| ≤ 10，保证一步内只触发 advance/demote 之一

数值经过几轮内测调，目标"错过 1 餐 < 拍 2 餐"，鼓励多吃 / 容错错过。

## 本地通知 vs APNs（expo-notifications）

无后端 → 不能持 device token → 用 expo-notifications **本地通知**，机端调度三餐 daily trigger（iOS 调度上限 64 个，绰绰有余）。优点：离线可用 / 隐私（token 不外发）/ 零成本。缺点：服务器无法远端控（"今天临时不推"）/ 无回执。mealmate 是工具型 app，少推销少打扰，v1.1+ 接 Worker 后**可能仍不上 APNs**。

## YOLO 自建食物识别（vs TFLite / Gemini Vision）

- TFLite 本地：.ipa 增大 + 推理慢 + 中餐精度差
- Gemini Vision：贵（图片计费），overkill
- 自建 YOLOv8 + FastAPI（xin 个人 GPU 机器，默认 `http://192.168.1.157:8000`）：可微调中餐、推理快、自有模型

**fail-soft 设计**：12s timeout，挂了不阻塞打卡（HP +5 / dialogue 照常），result 屏显示"识别服务没连上"。v0.6+ 迁公网 GPU + token-based auth。

---

每个选型都不是"非这个不可"，但合在一起体现 mealmate 一人公司 0-1 的整体取舍：**优先开发速度 + fail-soft 兜底 + 低维护**。

# 体重录入（Stage 2+）

每日拍体重秤照片 → Gemini Vision OCR → 手填校正 → addWeightRecord + HP +0.5。

```mermaid
flowchart TD
  Card[Stage 2+ home WeightCard] --> Modal[(modal)/weight-entry intro]
  Modal --> Skip{skipWeightPhoto?}
  Skip -- 是 --> Preview[preview 纯数字]
  Skip -- 否 --> Pick[拍秤 / 相册] --> PreviewImg[preview 图 + 数字]
  PreviewImg --> OCR[weightOcr<br/>Gemini 2.5 Flash Vision]
  OCR -- 20-250 --> AutoFill[setKgInput]
  OCR -- null / 错 --> ManualOnly[等手填]
  PreviewImg --> Confirm[确定<br/>kg 校验 20-250]
  Preview --> Confirm
  Confirm -- 合法 --> Add[addWeightRecord +0.5 HP] --> Result[result 大字 kg + 鼓励]
  Result -- 关闭 --> Home((main)/home)
```

## 正常
1. Stage 2+ home `<WeightCard>` 点 → `/(modal)/weight-entry`
2. 拍 / 相册 / `skipWeightPhoto` 直 preview
3. 自动 OCR（Gemini 2.5 Flash Vision，prompt 限数字 + unknown 兜底）→ 合理数字自动填，否则 manual
4. 确定 → `addWeightRecord({kg, photoUri})`：HP +0.5 + pushDialogue + 同日覆盖

## 异常
| 异常 | 处理 |
|---|---|
| OCR fail / null | 静默 fallback 手填 |
| kg 越界（20-250 外） | 红字提示，按钮 disable |
| 同日重复 | 覆盖当日（filter date !== date 后 push） |
| 中途关闭未保存 | Alert "现在退出会丢掉这次的体重记录" + 取消/放弃 |
| Gemini key 未配 | `if (!KEY) return null` 走 manual |
| 切照片 OCR 并发 | AbortController 取消旧请求 |
| 键盘弹起遮按钮 | ScrollView + KeyboardAvoidingView（[a52ddce](#)） |

## 状态变化
- `weightHistory`: 当日记录加 / 覆盖（每日唯一），保留最近 90 天
- `hp`: +0.5（clamp）
- `dialogueHistory`: 加 1 条
- HP +0.5 当前临时走 `__dev_setHp(before + 0.5)`，TODO 加 `markWeightLogged` 专用 action（详 `app/app/(modal)/weight-entry.tsx`）
- API key 暴露风险：详 [07-adr/0005-llm-key-client-exposure.md](../07-adr/0005-llm-key-client-exposure.md)

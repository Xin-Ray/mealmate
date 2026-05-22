## 模块名称
weight-entry（体重录入 modal）

## 模块目标
Stage 2+ 用户每日 21:00 前拍体重秤照片 + OCR 自动读数 + 手填校正 → 记录 kg + HP +0.5。

## 负责人
xin

## 依赖模块
- [store.md](./store.md)：`addWeightRecord` / `addHp(+0.5)` / `pushDialogue`
- `services/weightOcr.ts`：Gemini 2.5 Flash Vision
- [02-business-flows/weight-entry.md](../02-business-flows/weight-entry.md)

## 对外接口
- 路由：`/(modal)/weight-entry`
- store action：`addWeightRecord({ kg, photoUri? })`
- settings 开关：`skipWeightPhoto`（settings 里切，决定是否强制拍照）

## 核心状态
- 本地 state：`phase: 'intro'|'preview'|'uploading'|'result'`
- `imageUri: string | null`
- `kgInput: string`（数字键盘 input）
- `ocrAbortRef`：AbortController（切照片时取消旧请求）

## 核心逻辑
- **intro**：拍秤 / 相册；skipWeightPhoto=true 直接到 preview（纯数字输入）
- **preview**：图（如有）+ 数字 input，maxLength 6
- **OCR**（拍后自动）：weightOcr(imageUri) → Gemini 2.5 Flash Vision
  - 模型返合理数字（20-250）→ 自动填进 kgInput
  - "unknown" / 越界 / 错 → null，等用户手填
- **确定**校验：`kgNum >= 20 && kgNum <= 250` → uploading（0.5s loading）→ addWeightRecord
- **result**：HP+0.5 弹跳 + 大字 kg + 鼓励台词 + 关闭按钮

## 异常情况
| 异常 | 处理 |
|---|---|
| OCR fail / null | UI 静默 fallback 手填；不暴露技术错误 |
| kg 越界 | 输入框下红字"请输入 20-250 之间的数字"，按钮 disable |
| photoUri 缺失 + skipWeightPhoto 关 | 按钮 disable |
| 同日重复录入 | addWeightRecord 内部 filter `r.date !== date` 后 push，覆盖当日；不增加条数 |
| 中途关闭未保存 | onClose 检测 `kgInput \|\| imageUri` 非空 → Alert "现在退出会丢掉这次的体重记录" + 取消 / 放弃 |
| Gemini key 未配 | weightOcr 顶部 `if (!KEY) return null` 走 manual，user 不感知 |
| 切换照片 OCR 并发 | AbortController 取消旧请求 |
| 键盘弹起按钮被遮 | ScrollView + KeyboardAvoidingView（[commit a52ddce](#)） |

## 注意事项
- **HP +0.5** 一致于 PRD §11.F；实现走 `__dev_setHp(before + 0.5)` 是临时（TODO: 加 markWeightLogged 专用 action）
- OCR 模型：Gemini 2.5 Flash（非 lite，OCR 稳）
- prompt：限定数字 + unknown 二选
- API key 客户端暴露 v1.1 迁 Worker（[ADR-0005](../07-adr/0005-llm-key-client-exposure.md)）

## 模块不负责什么
- 体重趋势可视化 → [stats.md](./stats.md) 的 `<TrendChart>`
- Stage 1 用户不录体重（home 不显示 WeightCard）
- 周报 / 月报 → v1.1+
- 云同步 → v1.1+ Apple Sign In + Worker

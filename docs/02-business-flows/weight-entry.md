# 体重录入流程（Stage 2 起）

Stage 2 起，每日 21:00 前拍体重秤照片 + 自动 OCR 读 kg + 手填校正。

## 流程图

```mermaid
flowchart TD
  Stage2Home[Stage 2 home<br/>WeightCard] -- 点击 --> WeightModal[(modal)/weight-entry<br/>intro phase]
  WeightModal --> Skip{skipWeightPhoto?}
  Skip -- 是 --> Preview[preview phase<br/>纯数字输入]
  Skip -- 否 --> Pick[拍秤 / 相册选]
  Pick --> Camera/Library
  Camera/Library --> PreviewImg[preview phase<br/>图 + 数字输入]
  PreviewImg --> OCR[weightOcr<br/>Gemini 2.5 Flash Vision]
  OCR -- success kg in 20-250 --> AutoFill[setKgInput auto]
  OCR -- null / 错 --> ManualOnly[等用户手填]
  Preview --> Confirm{kg 合法<br/>且 photoReady?}
  PreviewImg --> Confirm
  Confirm -- 是 --> Uploading[uploading phase]
  Uploading --> Add[addWeightRecord<br/>{kg, photoUri}]
  Add --> Hp[hp +0.5]
  Add --> Dialogue[generateMascotLine LLM<br/>+ 兜底本地池<br/>kind=meal_done<br/>'体重打卡' 复用语义]
  Add --> Result[result phase<br/>HP+0.5 + 数字大字 + 鼓励]
  Result -- 关闭 --> Home((main)/home)
  Result -- 重拍 --> Pick
```

## 正常流程

1. Stage 2 home `<WeightCard>` 显示最近一次体重 + diff，点卡 → `router.push('/(modal)/weight-entry')`
2. **intro phase**：用户选"拍体重秤" / "从相册选"；如果 settings 开"跳过称重照片" → 直接到 preview（纯数字输入）
3. `pickImageWithFallback` 拿照片 → preview phase
4. **OCR**（如果有照片）：自动调 `weightOcr(imageUri)` 走 Gemini 2.5 Flash Vision，prompt "读体重秤数字（kg）"：
   - 模型返合理数字（20-250 范围）→ 自动填进 kgInput 输入框
   - 模型返 "unknown" / 数字越界 / API 错 → null，用户手填
5. **preview phase**：图 + 输入框（数字键盘，maxLength 6）；kg 校验 `kgNum >= 20 && kgNum <= 250`
6. 点"确定" → uploading（0.5s loading）→ `addWeightRecord({kg, photoUri})`
   - mealmate-store v9 `weightHistory` 按 date 去重（每天最多 1 条，覆盖）
   - HP +0.5（用 `__dev_setHp(before + 0.5)` —— TODO: 加 `markWeightLogged` 专用 action）
7. **result phase**：HP+0.5 弹跳 + 大字 kg 数字 + 鼓励台词（LLM 或本地池 fallback）
8. 用户点关闭 → `router.back()` → home WeightCard 显示新 kg + diff

## 异常流程

| 异常 | 处理 |
|---|---|
| **OCR 失败 / null** | UI 静默 fallback，等用户手填；不显示技术错误（"unknown" / "abort" 等不暴露） |
| **kg 不在 20-250** | 输入框下面红字"请输入 20-250 之间的数字"；按钮 disable |
| **photoUri 缺失 + skipWeightPhoto 关** | canConfirm = false，按钮 disable |
| **同日重复录入** | `addWeightRecord` filter `r.date !== date` 后 push，**覆盖**当日已有；mealHistory 总条数不增加 |
| **用户中途关闭（未保存）**  | onClose 检测 `kgInput \|\| imageUri` 非空 → Alert "还没保存 / 现在退出会丢掉这次的体重记录" + Cancel / Discard 二选 |
| **Gemini key 未配** | weightOcr 顶部 `if (!KEY) return null` → 走 manual 流，user 不感知 |
| **AbortController 触发** | 用户切换照片时 abort 旧请求；新照片重新 OCR |

## 状态变化

```
进 modal: phase: 'intro', imageUri: null, kgInput: ''
选图 + OCR success: imageUri='file://...', kgInput='60.5'（自动填）
用户手改: kgInput='61.0'
点确定: phase: 'uploading' → 'result'
  store:
    weightHistory: 当日记录加 / 覆盖；总保留最近 90 天
    hp: +0.5 (clamped)
    dialogueHistory: 加 1 条（LLM 文案或本地兜底）
关闭: state 不变，回 home
```

## 注意事项

- **HP +0.5** 跟 §11.F 体重打卡奖励一致；但实现里走 `__dev_setHp(before+0.5)` 是临时方案（避开新加 markWeightLogged action 的成本，注释 TODO 在 weight-entry.tsx）
- **OCR 模型**：Gemini 2.5 Flash（非 lite，OCR 稳定性优先）；prompt 限定数字 + unknown 二选
- **OCR fail-soft**：null 不报错给用户，等手填即可
- **API key 暴露问题** 跟 LLM 文案一样 —— 客户端 bundle 里反编译可见，v1.1 必迁 Worker（[ADR-0005](../07-adr/0005-llm-key-client-exposure.md)）
- skipWeightPhoto 开关：可在 settings 里关掉拍照要求，仅手填（适合相机权限拒绝的用户）

## 模块不负责

- Stage 1 用户的体重 —— Stage 1 不显示 WeightCard 入口，stage<2 不应该录入体重
- 体重趋势可视化 —— stats tab 的 `<TrendChart>` 负责
- 周报 / 月报 —— v1.1+ 计划
- 体重数据云同步 —— v1.1+ Apple Sign In + 后端

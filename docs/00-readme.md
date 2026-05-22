# 00 · 项目总览（一页纸）

> 给老板 / 产品 / 设计 / 测试 / 研发都能看懂。详细文档见数字编号目录。

## 项目快照

| 字段 | 值 |
|---|---|
| **项目名称** | MealMate —— 陪伴式健康饮食养成系统 |
| **业务目标** | 通过"血量(HP)"机器人伙伴 + 五阶段成长机制（坚持 → 量化 → 健康增重 → 营养 → 持之以恒），帮助饮食不规律 / 需要增重 / 饮食恢复期的用户长期坚持规律健康饮食。把数据记录变成有情绪连接的陪伴体验。 |
| **核心用户** | 长期饮食不规律 / 恢复期 / 偏瘦希望增重的人群。⚠️ **敏感人群重叠**（饮食障碍 / 恢复期用户），所有文案 / 机制受 [PRD §八 + §11.L 安全与伦理边界](./PRD.md) 硬约束。 |
| **核心流程** | onboarding → 三餐推送提醒 → 拍照打卡（HP +5）/ 错过（HP -10）→ 加餐补充（HP +10，每日上限 2 次）→ HP 累 100 进阶 / 降 0 降级 → Stage 2 起记录体重 → 趋势统计 |
| **当前架构** | 纯客户端 React Native + Expo + Zustand + AsyncStorage，**无后端**。本地推送 expo-notifications，图表 react-native-svg，LLM/OCR Gemini 直连，食物识别自托管 YOLO 后端，发布 EAS Build + TestFlight |
| **主要模块** | 首页 / 记录 / 统计 / 我的 / 拍照流程 / 体重录入 / 阶段转场 / 提醒系统 / 加餐 |
| **外部依赖** | Gemini API（LLM + Vision OCR）/ 自托管 YOLO 后端（食物识别）/ expo-notifications / react-native-svg / EAS + ASC / Apple Developer Program $99/年 |
| **核心风险** | 安全伦理（敏感用户） / API key 客户端暴露（v1.1 迁 Worker） / 数据无云备份 / 无用户行为分析 |
| **负责人** | xin（GitHub: [Xin-Ray](https://github.com/Xin-Ray)） |

## 5 分钟看懂项目

**Q1: 这 app 解决什么问题？**
A: 给「忘了吃饭」「不想吃」「一天只吃一顿」的人 —— 包括偏瘦想增重的、饮食恢复期的 —— 一个会撒娇会担心你的小机器人陪伴。把吃饭从任务变成关系。

**Q2: 跟其他健康 App 有啥不一样？**
A: 1) 不做减脂 / 卡路里管控，反向适配增重 / 恢复需求；2) 情感驱动而非数据驱动，HP 不是分数是机器人的精神状态；3) 五阶段递进，从"吃齐三餐"到"吃饱"到"健康增重"逐步加难度。

**Q3: 现在做到哪一步了？**
A: v1.0 已 ship 到 TestFlight（main HEAD 见 [`README.md`](../README.md) status badge）。完整跑通：onboarding / 三餐提醒 / 拍照打卡 / 错过扫描 / 体重录入 + OCR / 阶段转场（5 stage start+end+demote 屏）/ 加餐（每日上限 2）/ Stage 1 HP→0 走 support 调建议医生。

**Q4: 还有什么没做？**
A: v1.1 主要做后端 —— Cloudflare Worker 代理（必须做的安全债，把 Gemini key 从客户端搬走，详 [`07-adr/0005-llm-key-client-exposure.md`](./07-adr/0005-llm-key-client-exposure.md)）、Apple Sign In、云同步（解决换机数据丢失）、Stage 3-5 的业务逻辑、Sentry 监控。

**Q5: 技术栈为啥这样选？**
A: Expo（vs bare RN）速度优先，EAS Build 一键发布；Zustand（vs Redux）轻量 + persist 中间件 boilerplate 少；无后端是 MVP 阶段省服务器 + 跑通核心闭环优先。详 [`07-adr/`](./07-adr/) 7 个决策记录。

**Q6: 我从哪开始读？**
A: 按角色：
- **产品 / 老板** → 本文档（00）+ [02 业务流程](./02-business-flows/) + [`/docs/PRD.md`](./PRD.md) 详细
- **设计** → [`/docs/design-system.md`](./design-system.md)（tokens）+ [02 业务流程](./02-business-flows/) 看交互
- **测试** → [02 业务流程](./02-business-flows/) 每个流程都有"异常情况"+ [06 部署](./06-deploy/)
- **新研发** → [01 架构](./01-architecture.md) + [03 模块](./03-modules/) + [04 数据模型](./04-data-model/) + [07 ADR](./07-adr/) 知道历史决策为什么这样

## 文档地图

```
docs/
├── 00-readme.md              ← 你在这里
├── 01-architecture.md        系统架构 + 数据流图
├── 02-business-flows/        核心业务流程（每个一图，含正常/异常/状态变化）
├── 03-modules/               9 个模块的固定模板说明
├── 04-data-model/            zustand store schema 详解 + ER 图
├── 05-api/                   接口（v1.1 Worker stub + 现有 Gemini/YOLO contract）
├── 06-deploy/                EAS Build / TestFlight / App Store
├── 07-adr/                   7 条架构决策记录
└── 08-faq.md                 常见问题 + 排查
```

历史文档（v0.4-v1.0 期间用的）保留在 `docs/{product,design,api,architecture,dev,deploy}/` 子目录，顶部加迁移指引。

## 状态与版本

- 当前 main HEAD：见 [`README.md`](../README.md) status badge
- 持久化 schema 版本：**v9**（含 transitionsSeen / transitionsPending / stageWhenFailed；见 [`04-data-model/tables.md`](./04-data-model/tables.md) migrate 历史）
- TestFlight build 1：2026-05-18 上线
- 下次 production build：等 v1.1 完成后

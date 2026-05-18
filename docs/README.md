# MealMate 文档索引

- [产品](./product/) — PRD / roadmap / user stories / changelog / 商业模式
- [设计](./design/) — UI 规范 / 交互 / 资源
- [API](./api/) — 接口（v0.5+ 后端启用后填）
- [架构](./architecture/) — 系统总览 / 数据库 / 模块 / 技术调研 / ADR
- [开发](./dev/) — setup / workflow / 风格 / 测试 / dev-log（历史账本）
- [部署](./deploy/) — 环境 / 发布 / 回滚
- [UX flow](./ux-flow.md) — 全局导航 mermaid 流程图

## 当前状态：v0.4（客户端 only），iPhone dev build 可测，未上 TestFlight

主要进度：

- Stage 1 + Stage 2 主页接入完整 Figma 设计
- 三餐推送 / 拍照打卡 / 饱腹度评分 / 体重模块 / 错过餐扫描 全部业务闭环
- 4 tab（首页 / 记录 / 统计 / 我的）+ 5 个 modal（photo / weight-entry / meal-reminder / meal-missed / 5 阶段过渡屏 × 2）
- LLM 文案接入临时禁用（key 暴露问题），v0.5 走 Cloudflare Worker 代理
- 后端 / 同步 / 多端 / 订阅 → v0.5+

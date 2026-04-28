# mealmate

一款**陪伴式饮食习惯养成 App**：由一只有"HP"的机器人伙伴陪你按时吃饭、吃饱吃好，通过五阶段目标（坚持 → 量化 → 健康增重 → 营养 → 持之以恒），帮助饮食不规律、恢复期或需要健康增重的人群重建三餐节奏。

## 项目结构

- [`docs/PRD.md`](./docs/PRD.md) — 产品需求文档（一句话概述、目标用户、HP 机制、五阶段设计、MVP 范围、技术选型摘要、安全与伦理边界、待决策项）
- [`docs/tech-research.md`](./docs/tech-research.md) — 跨平台技术栈调研（React Native / Flutter / Capacitor / PWA / SwiftUI+Next.js 对比，含来源链接）
- `app/` — 代码占位，技术栈敲定后初始化

## 快速结论

- **推荐技术栈**：React Native + Expo + React Native Web（iOS + Web 一套 TypeScript 代码）
- **MVP 建议**：优先完整打磨阶段一——HP 系统、三餐推送、拍照验证、到 22 解锁阶段二的完整闭环
- **需要尽早决定**：阶段四/五机制、文案 tone 基线、是否规划 Apple Watch/HealthKit

> 草稿版本 v0.1，欢迎讨论。

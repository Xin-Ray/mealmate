# ADR-0004：用 Zustand 而非 Redux / Context / Recoil

- 日期：2025-08
- 状态：accepted
- 决策人：xin

## 背景

mealmate 状态层不简单：currentStage / hp / todayMeals / mealRecords / dialogueHistory / transitionsPending 等等十几个字段，多个组件并发读写。要选状态管理。

候选：
- React Context
- Redux Toolkit
- Zustand
- Jotai / Recoil

## 决策

**Zustand v5** + **persist 中间件**（AsyncStorage） + **v9 schema migrate**。

## 理由

- **API 极简**：`create((set, get) => ({ ... }))`，没 reducer / action creator / dispatch 概念
- **没 Provider 包裹**：避免大型 Context 树重渲染问题
- **小**：3KB gzip
- **persist 中间件官方**：与 AsyncStorage 配合好，version + migrate 一应俱全
- **TypeScript 友好**：单一 store interface，自动 infer
- **行业广泛使用**：v0.5+ 大量 RN 项目用，可借鉴 pattern

## 取舍

接受的：
- 没有 Redux DevTools 那种 time-travel（zustand 有 devtools 中间件但用得少）
- 全局 store 单一 file（useStore.ts）会变大 —— 已经 ~600 行，必要时按 slice 拆
- selector 写法稍微原始（直接 `useStore(s => s.hp)`）

放弃的：
- Redux 的 immer + RTK Query 数据流编排（mealmate 没复杂数据 fetch）
- Jotai 的"原子化"细粒度（mealmate 状态强相关，整体当一个 store 反而清晰）
- Context（性能 + 类型推导都差）

## 不变量保护

虽然 Zustand 允许 `set({ hp: 200 })` 这种"绕过"，约定：
- **所有写都经 action**（addHp / markMealDone / etc.）
- action 内部做 clamp + 触发 advance/demote
- dev actions（`__dev_*`）显式标注绕开边界，仅 `__DEV__`

## persist 策略

- key: `mealmate-store`
- storage: AsyncStorage
- version: 9（snack 分支合并后 v10）
- migrate: v1 → v9 每版本一个函数补默认 + 字段 rename，详 [04-data-model/tables.md](../04-data-model/tables.md)
- partialize: 当前不剔字段（整 state 都持久化）

## 后果

- 6 周 MVP 节奏跑下来证明轻量 state 管理够用
- 单 store file ~600 行可维护，但接近极限
- v1.0 后考虑：
  - 按 slice 拆 store（mealSlice / userSlice / dialogueSlice）
  - 加 zustand devtools middleware（dev only）
  - immer 中间件简化 nested update

## 相关

- [03-modules/store.md](../03-modules/store.md)
- [04-data-model/tables.md](../04-data-model/tables.md)

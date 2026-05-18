# Coding Style

> 当前 v0.4 没有严格的 lint 强制，下面是约定。v0.5+ 加 ESLint strict 规则集自动检查。

## TypeScript

- **strict mode 开启**（`tsconfig.json`）
- 任何 commit 前必须 `npx tsc --noEmit` 0 错
- 优先用 type 而非 interface（除非要做 declaration merging）
- `as never` / `as unknown as T` 仅在跟三方库的类型缺陷打架时用，必须加注释说明为什么
- 避免 `any`；不得已用 `unknown` + 收窄

## 文件命名

| 类型 | 命名 | 示例 |
|---|---|---|
| React 组件文件 | `PascalCase.tsx` | `MealReminderCard.tsx` |
| Hook / util | `camelCase.ts` | `useStore.ts` / `missedScan.ts` |
| 数据 / 常量 | `camelCase.ts` | `dialogues.ts` / `stageTransitions.ts` |
| 路由文件（Expo Router） | `kebab-case.tsx` | `meal-missed.tsx` / `stage-1-start.tsx` |
| 类型定义 | `types.ts` | `app/src/types/index.ts` |

## 目录结构

```
app/
├── app/                  Expo Router 文件路由
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (main)/           Tab navigator group
│   ├── (modal)/          Modal group
│   └── onboarding/
├── assets/               静态资源（mascot / hearts / tab-icons / images）
├── src/
│   ├── components/
│   │   ├── ui/           通用 UI 组件
│   │   ├── home/         首页专用业务模块
│   │   └── stage/        阶段过渡屏（feature/stage-transitions）
│   ├── data/             数据 / 常量（dialogues / feed / stageTransitions）
│   ├── services/         副作用（notifications / missedScan / mascotLlm / imagePicker）
│   ├── store/            zustand store + selectors
│   ├── theme/            tokens / hp band
│   └── types/            type 定义
```

## Hook 命名

- `use<Name>`（标准 RN 约定）
- store 单选 selector 抽出来时：`use<Field>`，例如 `const hp = useStore(s => s.hp)`
- 复合 selector 抽到 `store/selectors/<topic>.ts`，命名 `select<Name>`，例：`selectActiveReminderSlot`

## Store action 命名

- 业务 action：动词开头，camelCase。`markMealDone` / `addWeightRecord` / `advanceStage`
- Dev-only action：**前缀 `__dev_`**，仅在 `__DEV__` 守卫的开发者面板里调用。例：`__dev_setHp` / `__dev_resetTransitions`
- Async action 返回 Promise；store 不用 thunk middleware（zustand 5 原生支持）

## 缩进 / 格式

- **2 空格**缩进（沿用 RN / TS 社区默认）
- 行宽不强制；可读优先
- 字符串引号 **双引号** `"..."`（沿用 RN 项目默认）
- 文件末尾留一个空行
- 不用 semicolon-less style，统一加 `;`

## React 组件

- 优先 function component + hooks
- props 类型用 inline type 或单独 `type Props = ...` 在文件顶部
- 没有 `defaultProps` —— 用解构默认值：`function Foo({ x = 1 }: Props)`
- styles 用 inline `style={...}`（tokens 颜色 / 数值）或 NativeWind className —— 当前混用，未来 v0.5+ 统一选一种

## 注释

- 文件顶部留一段：用途 / 来源 / 关键决策（参照 `useStore.ts` / `HomeStage1.tsx`）
- 块注释带版本号 / Figma node-id：`// v0.4 hotfix #5（按 Figma 22:3）`
- 业务规则改动一定要标 PRD 章节引用：`// PRD §11.F.2`
- 中英文混排：技术词（HP / band / modal）保持英文，业务概念用中文

## Imports 排序

约定（不强制）：

1. React / RN
2. 三方库（按字母）
3. `expo-*`
4. 项目内：`@src/*`（绝对路径优先于相对路径）
5. types（`type` import 独立一段）

```ts
import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import { colors } from "@src/theme/tokens";
import type { MealSlot } from "@src/types";
```

## 测试

- v0.4 暂无 unit test。
- v0.5+ 计划：jest + react-native-testing-library 跑 store + selector + 关键 hook。
- 详见 [`docs/dev/testing.md`](./testing.md)。

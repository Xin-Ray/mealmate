# Database

## 当前 v0.4 — 客户端本地

唯一存储：**AsyncStorage**（RCTAsyncLocalStorage_V1）
唯一 key：**`mealmate-store`**
持久化方案：**Zustand `persist` 中间件** —— 整个 store 序列化为单条 JSON。

物理路径（iOS Simulator）：

```
~/Library/Developer/CoreSimulator/Devices/<UDID>/data/
   Containers/Data/Application/<app-UUID>/
   Library/Application Support/com.xinray.mealmate/
   RCTAsyncLocalStorage_V1/manifest.json
```

iPhone 真机：iOS sandbox 内，不可直接访问（要用 Xcode device container 工具）。

## Store schema（main 分支 v6）

```ts
type State = {
  // HP / 阶段
  hp: number;                              // 0–100
  currentStage: 1 | 2;                     // feature/stage-transitions widen 到 1|2|3|4|5
  companionLv: number;                     // 当前 1，advanceStage 时 +1
  
  // 用户配置
  robotName: string;                       // 默认 "小满"
  gentleMode: boolean;                     // 错过餐扣分减半
  mealSchedules: {                         // 三餐推送时间
    breakfast: string;                     // "HH:MM"
    lunch: string;
    dinner: string;
  };
  
  // 今日状态（每日 rollDayIfNeeded 重置）
  todayMeals: {
    breakfast: "pending" | "done" | "missed";
    lunch: "pending" | "done" | "missed";
    dinner: "pending" | "done" | "missed";
  };
  todayKey: string;                        // YYYY-MM-DD，跨日检测
  
  // 历史（trimmed 保留窗口）
  mealHistory: Record<string, TodayMeals>; // YYYY-MM-DD → 当天 3 餐状态，最多 30 天
  weightHistory: WeightRecord[];           // 按 date 升序，最多 90 天
  fullnessHistory: FullnessRecord[];       // 最多 270 条（90 天 × 3 餐）
  mealRecords: MealRecord[];               // 每次 markMeal* 落一条；无限增长，未来加 trim
  dialogueHistory: DialogueRecord[];       // 倒序，最多 50 条
  
  // 配置
  skipWeightPhoto: boolean;                // settings 开关
  
  // 频控
  disappearWarningLastShownAt: number | null; // ms timestamp，7 天最多 1 次
  
  // 引导
  onboardingDone: boolean;
};
```

### 子类型

```ts
type WeightRecord = {
  date: string;          // YYYY-MM-DD
  kg: number;            // 精度 0.1
  photoUri: string;      // local file:// URI
  recordedAt: number;    // ms timestamp
};

type FullnessRecord = {
  id: string;
  mealSlot: "breakfast" | "lunch" | "dinner";
  date: string;
  score: 3 | 5 | 8;      // 离散 3 选 1，对应 😞/😐/😊
  recordedAt: number;
};

type MealRecord = {
  id: string;             // "meal-<date>-<slot>-<ts>"
  date: string;
  mealSlot: MealSlot;
  status: "done" | "missed";
  ts: number;
  hpDelta: number;        // +5 / -10 / -5(gentle)
  photoUri?: string;
  acknowledged?: boolean; // v5 加，missed 卡 / modal "我知道了" 后置 true
};

type DialogueRecord = {
  id: string;
  ts: number;
  kind: "remind" | "encourage" | "meal_done" | "meal_missed" | ...;
  body: string;
  mealSlot?: MealSlot;
  hpDelta?: number;
};
```

### feature/stage-transitions 加的字段（v7）

```ts
// 仅在 feature/stage-transitions 分支
transitionsSeen: Array<{ stage: number; kind: "start" | "end" }>;
```

## Persist version migration

| version | 时间 | 改动 | migrate 逻辑 |
|---|---|---|---|
| v1 | v0.2 起 | 初版 schema（HP 0–15）| — |
| v2 | v0.4 §11.B | HP scale → 0–100 | `hp = round(hp * 100/15)`, clamp 0–100 |
| v3 | v0.4 §11.D.1 | 加 `fullnessHistory` | 缺失 → `[]` |
| v4 | v0.4 §11.K-7 | `dialogueHistory: string[] → DialogueRecord[]`；加 `mealRecords` | 老 string[] 全丢；缺失 → `[]` |
| v5 | v0.4 §11.K-7 | `MealRecord` 加可选 `acknowledged` | noop（缺失 = undefined = 未确认）|
| v6 | v0.4 hotfix#13 | 起始 HP stage 1=60 / stage 2=50 | noop（仅新用户从 60 起；老用户 hp 保留）|
| v7 | feature/stage-transitions | 加 `transitionsSeen` | 按 `currentStage` 回填已看，避免老用户补弹历史 modal |

## 限制 / TODO

- **mealRecords 无限增长**：当前每次 markMeal* 都 append，没有 trim。v0.5 加 90 天滑窗。
- **跨日重置时机**：`rollDayIfNeeded` 在 RootLayout mount + AppState active 时调，最坏情况下用户开 app 看到 1-2 秒的昨日数据再 reset。
- **单设备**：换手机数据丢失。v0.5+ Apple Sign In + 服务端 sync 解决。

## v0.5+ 服务端数据库预案

技术栈：**Cloudflare D1**（SQLite-compatible，CF Worker 原生支持）。

### Tables

```sql
-- 用户
CREATE TABLE User (
  id          TEXT PRIMARY KEY,           -- nanoid
  apple_sub   TEXT UNIQUE NOT NULL,       -- Apple Sign In subject
  email       TEXT,
  robot_name  TEXT NOT NULL DEFAULT '小满',
  current_stage INTEGER NOT NULL DEFAULT 1,
  companion_lv  INTEGER NOT NULL DEFAULT 1,
  hp          REAL    NOT NULL DEFAULT 60,
  gentle_mode INTEGER NOT NULL DEFAULT 0, -- 0/1
  plan        TEXT    NOT NULL DEFAULT 'free', -- free/pro
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- 餐次记录（对应客户端 mealRecords）
CREATE TABLE MealEvent (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES User(id),
  date        TEXT NOT NULL,              -- YYYY-MM-DD
  meal_slot   TEXT NOT NULL,              -- breakfast/lunch/dinner
  status      TEXT NOT NULL,              -- done/missed
  ts          INTEGER NOT NULL,
  hp_delta    REAL    NOT NULL,
  photo_url   TEXT,                       -- 上传到 R2 后的 url
  acknowledged INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_meal_user_date ON MealEvent(user_id, date);

-- 体重
CREATE TABLE WeightLog (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT NOT NULL REFERENCES User(id),
  date         TEXT NOT NULL,
  kg           REAL NOT NULL,
  photo_url    TEXT,
  recorded_at  INTEGER NOT NULL,
  UNIQUE (user_id, date)                  -- 同日覆盖
);

-- 饱腹度
CREATE TABLE FullnessLog (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES User(id),
  meal_slot    TEXT NOT NULL,
  date         TEXT NOT NULL,
  score        INTEGER NOT NULL,
  recorded_at  INTEGER NOT NULL,
  UNIQUE (user_id, date, meal_slot)       -- 每餐每天一条
);

-- 订阅
CREATE TABLE Subscription (
  user_id        TEXT PRIMARY KEY REFERENCES User(id),
  apple_tx_id    TEXT,
  product_id     TEXT,                    -- monthly / yearly / lifetime
  active_until   INTEGER NOT NULL,        -- ms timestamp
  created_at     INTEGER NOT NULL
);
```

### 同步策略

- 增量 sync：客户端记录 `lastSyncedAt`，每次 POST 只传 > lastSyncedAt 的记录。
- 冲突：服务端 last-write-wins（按 `recorded_at` / `ts`）。
- 删账户：硬删 User + cascade 删所有关联表，30 天后 R2 backup 也清空。

### 备份 / 恢复

- D1 自带 PITR（point-in-time-recovery），保留 30 天。
- 每周 export 到 R2 长期保留。

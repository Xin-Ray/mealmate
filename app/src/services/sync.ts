// Store <-> mealmate backend 同步。
//
// 数据模型：服务端把整个 store state 当成一个 JSON blob 存（user_data 表）。
// 没有按字段做 diff，没有冲突解决——"最后写赢"。多设备并发会丢数据，v1 接受。
//
// SYNCED_KEYS 必须跟 useStore.ts 里 type State 的字段保持一致。新增持久化
// 字段时记得来这里加一行（lint 不会提醒）。

import { useStore } from "@src/store/useStore";
import { apiRequest } from "./apiClient";

// 跟 useStore.persist version 对齐；migrate 跨版本由 store 自己处理，这里只做 guard
export const SYNC_SCHEMA_VERSION = 12;

export const SYNCED_KEYS = [
  "hp",
  "currentStage",
  "companionLv",
  "robotName",
  "gentleMode",
  "mealSchedules",
  "todayMeals",
  "todayKey",
  "mealHistory",
  "weightHistory",
  "skipWeightPhoto",
  "fullnessHistory",
  "mealRecords",
  "dialogueHistory",
  "disappearWarningLastShownAt",
  "onboardingDone",
  // v10
  "onboardingCompletedAt",
  "transitionsSeen",
  "transitionsPending",
  // v11 健康数据 + stage 时间线 + stage 5 状态 + HP 历史
  "height",
  "gender",
  "ethnicity",
  "targetWeight",
  "stageHistory",
  "stage5StartedAt",
  "stage5Stars",
  "stage5LastStarCheck",
  "hpHistory",
  // account / lastSyncedAt 不同步：account 是登录态本身，lastSyncedAt 是 push 后写的本地标识
] as const;

type SyncedSnapshot = Record<string, unknown>;

const takeSnapshot = (): SyncedSnapshot => {
  const s = useStore.getState() as unknown as Record<string, unknown>;
  const out: SyncedSnapshot = {};
  for (const k of SYNCED_KEYS) out[k] = s[k];
  return out;
};

const applySnapshot = (snapshot: SyncedSnapshot): void => {
  const patch: Record<string, unknown> = {};
  for (const k of SYNCED_KEYS) {
    if (k in snapshot) patch[k] = snapshot[k];
  }
  // 不替换 action，只 merge 数据字段
  useStore.setState(patch as Parameters<typeof useStore.setState>[0]);
};

type PullResponse = {
  payload: SyncedSnapshot | null;
  schema_version: number | null;
  updated_at: string | null;
};

export async function pushSnapshot(token: string): Promise<string> {
  const r = await apiRequest<{ ok: true; updated_at: string }>("/sync/push", {
    method: "POST",
    token,
    body: { payload: takeSnapshot(), schema_version: SYNC_SCHEMA_VERSION },
  });
  useStore.getState().setLastSyncedAt(Date.now());
  return r.updated_at;
}

export async function pullSnapshot(
  token: string
): Promise<{
  payload: SyncedSnapshot;
  schema_version: number;
  updated_at: string;
} | null> {
  const r = await apiRequest<PullResponse>("/sync/pull", { method: "GET", token });
  if (!r.payload || r.schema_version == null || r.updated_at == null) return null;
  return {
    payload: r.payload,
    schema_version: r.schema_version,
    updated_at: r.updated_at,
  };
}

// 首次登录的同步策略：服务端空 → 上传本地；服务端有 → 拉回覆盖本地。
// schema 不匹配时跳过 apply 但不 push，避免被本地老版本覆盖云端新版本。
export type SignInSyncResult = "uploaded" | "downloaded" | "schema-mismatch";

export async function syncOnSignIn(token: string): Promise<SignInSyncResult> {
  const pulled = await pullSnapshot(token);
  if (pulled === null) {
    await pushSnapshot(token);
    return "uploaded";
  }
  if (pulled.schema_version !== SYNC_SCHEMA_VERSION) {
    console.warn(
      `[sync] schema mismatch: server=${pulled.schema_version} local=${SYNC_SCHEMA_VERSION}`
    );
    return "schema-mismatch";
  }
  applySnapshot(pulled.payload);
  return "downloaded";
}

// 节流 push：store mutation 后等 delayMs 再批量提交。多次调用只会留最后一次。
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingToken: string | null = null;

export function schedulePush(token: string, delayMs: number = 5_000): void {
  pendingToken = token;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    const t = pendingToken;
    pendingToken = null;
    if (!t) return;
    pushSnapshot(t).catch((e) => console.warn("[sync] push failed", e));
  }, delayMs);
}

export function cancelPendingPush(): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  pendingToken = null;
}

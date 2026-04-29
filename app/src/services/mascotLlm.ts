// Mascot LLM — Gemini 2.5 Flash Lite 生成 mascot 文案
//
// 设计：
// - dev 阶段：用 EXPO_PUBLIC_GEMINI_KEY（粘在 app/.env.local）。
//   该 key 会被打进客户端 bundle，反编译可见 —— 仅适合 closed beta。
// - 上线前切到 Cloudflare Worker 代理：客户端调 worker，worker 持 key + 加 rate limit。
//   见 docs/dev-log.md。
//
// 返回 null 表示「不要用 LLM 文案」，调用方 fallback 到 dialogues.ts 的 mock 文案。
// null 的来源有三：① LLM_ENABLED=false（全局开关）② 没 KEY ③ 网络/HTTP 错误
//
// ⚠️ 全局开关 EXPO_PUBLIC_LLM_ENABLED（2026-04-29 加）：
//   - 缺失或非 "true" 都视为关闭，generateMascotLine 立刻返回 null
//   - 当前默认关闭：调试期 token quota 用完了，全量走 mock
//   - 想开回 AI：app/.env.local 改 `EXPO_PUBLIC_LLM_ENABLED=true`，Metro 按 r reload
//
// 模型选择：gemini-2.5-flash-lite —— 当前 Gemini family 里最便宜+最快的模型，
// mealmate 单次输出 < 20 字完全够用。注意：gemini-2.0-flash 在新申请的 free tier
// key 上 quota=0，2.5-flash-lite 才是 free tier 主力。

import type { HpBand, MealSlot } from "@src/types";

const LLM_ENABLED =
  (process.env.EXPO_PUBLIC_LLM_ENABLED ?? "false").toLowerCase() === "true";
const KEY = process.env.EXPO_PUBLIC_GEMINI_KEY ?? "";
const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

export type MascotContext = {
  stage: 1 | 2;
  hp: number;
  band: HpBand;
  robotName: string;
  slot?: MealSlot;
  recentAction?: "meal_done" | "meal_missed" | "idle";
};

const systemPromptOf = (name: string) => `你是 mealmate 里陪伴用户吃饭的小机器人「${name}」。请用第一人称对用户说一句中文，长度 12-20 字。一句话，不要 emoji，不要标点叠加，不要解释，不要使用引号包裹。

按用户当前阶段和 HP 区间调整语气：
- HP 0-3（虚弱）：温柔撒娇，请求陪伴。绝对不要"消失/不见/离开/死亡"等硬性威胁，只用"撑不住""有点没力气""想见你"等温和表达。
- HP 4-7（饿）：撒娇式提醒，正向引导，"有点饿啦""一起开动"。
- HP 8-11（恢复中）：陪伴式鼓励，肯定用户最近的努力。
- HP 12-15（开心）：高情绪、轻盈正向，鼓励继续保持。

阶段 1：聚焦"今天的下一顿"和"坚持三餐"。
阶段 2：聚焦"吃饱"和"稳定节奏"。

每次必须不一样，不要套用模板。`;

const slotLabelOf = (slot?: MealSlot) =>
  slot === "breakfast" ? "早餐" :
  slot === "lunch" ? "午餐" :
  slot === "dinner" ? "晚餐" :
  "（无特定餐次）";

export async function generateMascotLine(
  ctx: MascotContext,
  signal?: AbortSignal
): Promise<string | null> {
  if (!LLM_ENABLED) {
    if (__DEV__) console.log("[mascotLlm] LLM_ENABLED=false — fallback to mock");
    return null;
  }
  if (!KEY) {
    if (__DEV__) console.warn("[mascotLlm] no EXPO_PUBLIC_GEMINI_KEY in env — fallback to mock");
    return null;
  }
  if (__DEV__) console.log("[mascotLlm] calling Gemini, key prefix:", KEY.slice(0, 6));

  const userPrompt = `阶段 ${ctx.stage}，HP ${ctx.hp}/15（${ctx.band}），餐次 ${slotLabelOf(ctx.slot)}，最近行为：${ctx.recentAction ?? "idle"}。请说一句话。`;

  try {
    const r = await fetch(`${ENDPOINT}?key=${KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPromptOf(ctx.robotName) }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          maxOutputTokens: 80,
        },
      }),
    });
    if (!r.ok) {
      if (__DEV__) {
        const body = await r.text().catch(() => "(no body)");
        console.warn("[mascotLlm] HTTP", r.status, body.slice(0, 300));
      }
      return null;
    }
    const j = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      if (__DEV__) console.warn("[mascotLlm] response missing text:", JSON.stringify(j).slice(0, 300));
      return null;
    }
    const cleaned = text.trim().replace(/^["『「]+|["』」]+$/g, "").trim();
    if (__DEV__) console.log("[mascotLlm] ok:", cleaned);
    return cleaned.length > 0 ? cleaned : null;
  } catch (e) {
    if (__DEV__) console.warn("[mascotLlm] fetch error:", String(e));
    return null;
  }
}

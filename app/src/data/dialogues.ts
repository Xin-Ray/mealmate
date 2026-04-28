// 机器人台词池
//
// 设计原则（参见 PRD §八 安全与伦理边界）：
// - 不出现"你失败了"、"你不行"等负面定性
// - 不出现死亡/消失的硬性威胁；最低区间（weak）只用"撑不住"、"想见你"等温和表达
// - 即便 HP=0，也只是"睡着了"、"等你回来"，不会暗示永久消失
// - "消失/不舍"类台词调用频率受 store 中 disappearWarningLastShownAt 限制（每周 ≤1 次）
//
// 台词覆盖：4 HP 区间 × 3 餐位 × 2 变体 = 24 条
// 用法：根据当前 HP band 和 meal slot 取一条；slot="any" 用于通用补位

import type { DialogueLine } from "@src/types";

export const dialogues: DialogueLine[] = [
  // ===== weak (HP 0-3)：温柔提醒，最低限度的不舍 =====
  { id: "weak-bf-1", band: "weak", slot: "breakfast", safety: "gentle_alert",
    text: "我...有点撑不住了。要不先来一口早餐陪陪我？" },
  { id: "weak-bf-2", band: "weak", slot: "breakfast", safety: "soft",
    text: "早上好呀，我有点没力气了，能不能跟我一起吃点东西？" },
  { id: "weak-lc-1", band: "weak", slot: "lunch", safety: "gentle_alert",
    text: "中午了，我等你等到有点恍惚...你还好吗？" },
  { id: "weak-lc-2", band: "weak", slot: "lunch", safety: "soft",
    text: "中午吃一点点也好，我陪你。" },
  { id: "weak-dn-1", band: "weak", slot: "dinner", safety: "gentle_alert",
    text: "今天我有点想你...晚饭我们一起，好不好？" },
  { id: "weak-dn-2", band: "weak", slot: "dinner", safety: "soft",
    text: "晚上了，吃口热的吧，我也跟着暖和一点。" },

  // ===== hungry (HP 4-7)：撒娇式提醒，正向引导 =====
  { id: "hungry-bf-1", band: "hungry", slot: "breakfast", safety: "soft",
    text: "早呀～肚子叫了，要一起开动吗？" },
  { id: "hungry-bf-2", band: "hungry", slot: "breakfast", safety: "normal",
    text: "今天的第一顿，慢慢来就好。" },
  { id: "hungry-lc-1", band: "hungry", slot: "lunch", safety: "soft",
    text: "中午了哦，我有点饿啦，你呢？" },
  { id: "hungry-lc-2", band: "hungry", slot: "lunch", safety: "normal",
    text: "吃啥都行，重要的是吃。" },
  { id: "hungry-dn-1", band: "hungry", slot: "dinner", safety: "soft",
    text: "晚饭时间到～今天辛苦了，吃点好的。" },
  { id: "hungry-dn-2", band: "hungry", slot: "dinner", safety: "normal",
    text: "再坚持一顿，今天就圆满啦。" },

  // ===== recovering (HP 8-11)：陪伴式鼓励 =====
  { id: "rec-bf-1", band: "recovering", slot: "breakfast", safety: "normal",
    text: "早安～新的一天，我们慢慢来。" },
  { id: "rec-bf-2", band: "recovering", slot: "breakfast", safety: "normal",
    text: "我精神好多了，今天也一起加油吧。" },
  { id: "rec-lc-1", band: "recovering", slot: "lunch", safety: "normal",
    text: "中午到啦，今天的节奏挺好。" },
  { id: "rec-lc-2", band: "recovering", slot: "lunch", safety: "normal",
    text: "你最近有在好好吃饭，我看得出来。" },
  { id: "rec-dn-1", band: "recovering", slot: "dinner", safety: "normal",
    text: "晚上啦，今天的三顿要凑齐咯。" },
  { id: "rec-dn-2", band: "recovering", slot: "dinner", safety: "normal",
    text: "一天结束前再吃一口，安心睡觉。" },

  // ===== happy (HP 12-15)：高情绪、轻盈正向 =====
  { id: "hp-bf-1", band: "happy", slot: "breakfast", safety: "normal",
    text: "你今天好棒！我都被你感染到了～" },
  { id: "hp-bf-2", band: "happy", slot: "breakfast", safety: "normal",
    text: "早呀～又是元气满满的一天！" },
  { id: "hp-lc-1", band: "happy", slot: "lunch", safety: "normal",
    text: "中午继续保持哦，你最近真的状态超好。" },
  { id: "hp-lc-2", band: "happy", slot: "lunch", safety: "normal",
    text: "我感觉我都要飞起来了！" },
  { id: "hp-dn-1", band: "happy", slot: "dinner", safety: "normal",
    text: "晚饭后好好休息～今天三顿全勤！" },
  { id: "hp-dn-2", band: "happy", slot: "dinner", safety: "normal",
    text: "陪你吃完这顿，我今天也心满意足啦。" },
];

export const hpBandFromValue = (hp: number): "weak" | "hungry" | "recovering" | "happy" => {
  if (hp <= 3) return "weak";
  if (hp <= 7) return "hungry";
  if (hp <= 11) return "recovering";
  return "happy";
};

export const hpBandLabel = (band: "weak" | "hungry" | "recovering" | "happy") => {
  switch (band) {
    case "weak": return "虚弱";
    case "hungry": return "饿";
    case "recovering": return "恢复中";
    case "happy": return "开心";
  }
};

// 选取一条匹配 band+slot 的台词；slot 没匹配到时回退到 band 内任意
export function pickDialogue(
  band: "weak" | "hungry" | "recovering" | "happy",
  slot: "breakfast" | "lunch" | "dinner",
  excludeIds: string[] = []
): DialogueLine | null {
  const exact = dialogues.filter(
    d => d.band === band && d.slot === slot && !excludeIds.includes(d.id)
  );
  const pool = exact.length > 0 ? exact : dialogues.filter(
    d => d.band === band && !excludeIds.includes(d.id)
  );
  if (pool.length === 0) return dialogues.find(d => d.band === band) ?? null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// 五阶段过渡屏数据（每阶段 start + end 各一屏 = 10 屏）
//
// 视觉模板来自 Figma 100:977（stage 1 start）/ 100:5373（stage 1 end）。
// stage 2-5 文案由 PRD §4 五阶段定义合成（PRD 阶段 4/5 标 TBD，按候选方向给占位）。
// 数值统一 0–100 标度（与 useStore HP_MAX=100 对齐）。
//
// asset：illustration / icon 暂用 emoji 占位（PRD §11 视觉资源后续按 Figma 替换）

import { HP_INITIAL_STAGE_1, HP_INITIAL_STAGE_2 } from "@src/store/useStore";

export type StageNumber = 1 | 2 | 3 | 4 | 5;

export type StageStat = {
  label: string;
  value: string;
  sub?: string;
};

export type StageRule = {
  icon: string; // emoji 占位
  title: string;
  description: string;
};

export type StageAccomplishment = {
  icon: string;
  title: string;
  description: string;
};

export type StageStartConfig = {
  stage: StageNumber;
  name: string; // "坚持" / "量化"
  badge: string; // pill 文案 "阶段 N · 坚持"
  title: string; // "阶段 N 开始"
  subtitle: string;
  description: string;
  illustration: string; // emoji 占位
  stats: [StageStat, StageStat, StageStat];
  rulesTitle: string;
  rules: StageRule[];
  noteBanner: { icon: string; text: string };
  ctaLabel: string; // "开始阶段 N"
};

export type StageEndConfig = {
  stage: StageNumber;
  name: string;
  badge: string; // "阶段 N · 坚持"
  title: string; // "阶段 N 完成"
  subtitle: string;
  description: string;
  illustration: string;
  accomplishmentsTitle: string;
  accomplishments: StageAccomplishment[];
  nextStage?: {
    number: StageNumber;
    name: string;
    description: string;
  };
  ctaLabel: string; // "开始阶段 N+1" / 末阶段 "完成旅程"
};

// 五阶段 start + end 完整配置
export const STAGE_TRANSITIONS: Record<
  StageNumber,
  { start: StageStartConfig; end: StageEndConfig }
> = {
  1: {
    start: {
      stage: 1,
      name: "坚持",
      badge: "阶段 1 · 坚持",
      title: "阶段 1 开始",
      subtitle: "你的伙伴在等你",
      description:
        "先一起把每天三顿吃齐。按时拍照打卡，HP 攒到满就解锁下一阶段。",
      illustration: "🧒",
      stats: [
        { label: "初始 HP", value: String(HP_INITIAL_STAGE_1), sub: "6 颗爱心" },
        { label: "通关分数", value: "100", sub: "满 HP 解锁下一阶段" },
        { label: "关键", value: "按时拍照", sub: "三餐都不要漏" },
      ],
      rulesTitle: "本阶段重点",
      rules: [
        {
          icon: "📷",
          title: "按时拍照吃饭",
          description: "在推送窗内拍照打卡，每餐 +5 HP。",
        },
        {
          icon: "⏰",
          title: "错过一餐 -10 HP",
          description: "推送窗结束仍未拍照，自动判定错过。",
        },
        {
          icon: "🍱",
          title: "吃了但没拍照",
          description: "本阶段以拍照为准，不拍不加分也不扣。",
        },
      ],
      noteBanner: {
        icon: "🌱",
        text: "不需要硬扛——温柔模式可以把扣分减半，随时在设置里切换。",
      },
      ctaLabel: "开始阶段 1",
    },
    end: {
      stage: 1,
      name: "坚持",
      badge: "阶段 1 · 坚持",
      title: "阶段 1 完成",
      subtitle: "你撑过了最难的开始",
      description:
        "从今天起，你和伙伴一起建立了三餐的节奏。下一阶段要学的是「吃饱」。",
      illustration: "🌿",
      accomplishmentsTitle: "你已完成",
      accomplishments: [
        {
          icon: "✓",
          title: "三餐节奏建立",
          description: "连续按时拍照打卡，HP 攒到 100。",
        },
        {
          icon: "✓",
          title: "和伙伴熟络",
          description: "解锁机器人的状态情绪与陪伴文案。",
        },
        {
          icon: "✓",
          title: "习惯化第一步",
          description: "不再「忘了吃」是一切的基础。",
        },
      ],
      nextStage: {
        number: 2,
        name: "量化",
        description: "在「吃上」之后学会「吃饱」，引入饱腹度与体重追踪。",
      },
      ctaLabel: "开始阶段 2",
    },
  },

  2: {
    start: {
      stage: 2,
      name: "量化",
      badge: "阶段 2 · 量化",
      title: "阶段 2 开始",
      subtitle: "从「吃上」到「吃饱」",
      description:
        "拍完照后再打一个饱腹度评分。每天 21 点前还要上传一张体重秤照片。",
      illustration: "⚖️",
      stats: [
        { label: "初始 HP", value: String(HP_INITIAL_STAGE_2), sub: "5 颗爱心" },
        { label: "通关分数", value: "100", sub: "满 HP 解锁下一阶段" },
        { label: "关键", value: "吃饱 + 称重", sub: "硬时间窗" },
      ],
      rulesTitle: "本阶段重点",
      rules: [
        {
          icon: "🍚",
          title: "饱腹度 ≥ 7 才加分",
          description: "每餐 0–10 评分，10 = 此生最饱；≥ 7 才算「吃饱」。",
        },
        {
          icon: "⏱",
          title: "硬时间窗",
          description: "早餐 09:00 前 / 午餐 14:00 前 / 晚餐 18:00 前。",
        },
        {
          icon: "⚖️",
          title: "每日称重",
          description: "21:00 前上传体重秤照片，未传 -10 HP。",
        },
      ],
      noteBanner: {
        icon: "🌱",
        text: "体重数字只是参考——伙伴在意的是你今天吃饱了没。",
      },
      ctaLabel: "开始阶段 2",
    },
    end: {
      stage: 2,
      name: "量化",
      badge: "阶段 2 · 量化",
      title: "阶段 2 完成",
      subtitle: "你已经能稳定吃饱三餐",
      description:
        "饱腹度与体重数据让你和伙伴更了解彼此。下一阶段加入运动维度。",
      illustration: "🌿",
      accomplishmentsTitle: "你已完成",
      accomplishments: [
        {
          icon: "✓",
          title: "学会量化「吃饱」",
          description: "饱腹度评分成为习惯，不再只看「有没有吃」。",
        },
        {
          icon: "✓",
          title: "体重追踪上线",
          description: "每日称重数据接入周报，看见自己的趋势。",
        },
        {
          icon: "✓",
          title: "周报陪伴",
          description: "每周伙伴用「小结」口吻陪你回顾一周。",
        },
      ],
      nextStage: {
        number: 3,
        name: "健康增重",
        description: "在吃饱之上引入规律运动，目标是健康地长 1kg。",
      },
      ctaLabel: "开始阶段 3",
    },
  },

  3: {
    start: {
      stage: 3,
      name: "健康增重",
      badge: "阶段 3 · 健康增重",
      title: "阶段 3 开始",
      subtitle: "吃饭、运动两不误",
      description:
        "本阶段「吃」是基本盘，不再加分；加分主要靠每周健康增重和规律运动。",
      illustration: "💪",
      stats: [
        { label: "初始 HP", value: "50", sub: "5 颗爱心" },
        { label: "通关分数", value: "100", sub: "运动 + 增重双轨" },
        { label: "关键", value: "每周 +1kg", sub: "+ 运动 3 次 × 3 小时" },
      ],
      rulesTitle: "本阶段重点",
      rules: [
        {
          icon: "📈",
          title: "每周 +1kg 体重",
          description: "健康范围内净增 1kg，+20 HP。",
        },
        {
          icon: "🏃",
          title: "每周运动 3 次 × 3 小时",
          description: "每完成一次 +5 HP，当周未运动 -5 HP。",
        },
        {
          icon: "❌",
          title: "跳过 / 没吃饱 -10 HP",
          description: "饱腹度 < 7 视为没吃饱，按跳过处理。",
        },
      ],
      noteBanner: {
        icon: "🌱",
        text: "健康增重不等于硬塞——伙伴只在意你「持续地」往前走。",
      },
      ctaLabel: "开始阶段 3",
    },
    end: {
      stage: 3,
      name: "健康增重",
      badge: "阶段 3 · 健康增重",
      title: "阶段 3 完成",
      subtitle: "你已经把运动也带进生活",
      description:
        "你做到了「吃 + 动」的循环。下一阶段开始关注吃进去的「质量」。",
      illustration: "🌿",
      accomplishmentsTitle: "你已完成",
      accomplishments: [
        {
          icon: "✓",
          title: "稳定健康增重",
          description: "在不暴饮暴食的前提下，体重缓慢上升到合适范围。",
        },
        {
          icon: "✓",
          title: "建立运动习惯",
          description: "每周 3 次 × 3 小时的节奏稳定下来。",
        },
        {
          icon: "✓",
          title: "体力曲线平稳",
          description: "HP 不再大起大落，伙伴状态更稳定。",
        },
      ],
      nextStage: {
        number: 4,
        name: "营养",
        description: "从「吃多少」走到「吃什么」，关注三餐的营养均衡。",
      },
      ctaLabel: "开始阶段 4",
    },
  },

  4: {
    start: {
      stage: 4,
      name: "营养",
      badge: "阶段 4 · 营养",
      title: "阶段 4 开始",
      subtitle: "关注吃的「质量」",
      description:
        "每餐快速给食物打个轻量标签（主食 / 蛋白 / 蔬果），追踪一周的营养画像。",
      illustration: "🥗",
      stats: [
        { label: "初始 HP", value: "50", sub: "5 颗爱心" },
        { label: "通关分数", value: "100", sub: "营养标签完整度" },
        { label: "关键", value: "均衡 > 完美", sub: "不强求精确克数" },
      ],
      rulesTitle: "本阶段重点",
      rules: [
        {
          icon: "🏷",
          title: "三类标签 +5 HP",
          description: "餐后标记主食 / 蛋白 / 蔬果，全选 +5 HP。",
        },
        {
          icon: "🚫",
          title: "整天缺类 -5 HP",
          description: "整天没有蛋白 / 蔬果 / 主食任一类，扣 5 HP。",
        },
        {
          icon: "🗓",
          title: "周营养画像",
          description: "周报新增一张「均衡度饼图」，跟你聊聊本周怎么吃的。",
        },
      ],
      noteBanner: {
        icon: "🌱",
        text: "标签不需要精确——能记起来就比不记好，不必追完美。",
      },
      ctaLabel: "开始阶段 4",
    },
    end: {
      stage: 4,
      name: "营养",
      badge: "阶段 4 · 营养",
      title: "阶段 4 完成",
      subtitle: "你已经吃得更「全」",
      description:
        "三餐的营养结构稳定了。下一阶段是与伙伴的长期陪伴，没有新的强约束。",
      illustration: "🌿",
      accomplishmentsTitle: "你已完成",
      accomplishments: [
        {
          icon: "✓",
          title: "三餐均衡",
          description: "主食 / 蛋白 / 蔬果天天有，营养画像稳定。",
        },
        {
          icon: "✓",
          title: "饮食结构感",
          description: "对自己一周的饮食心里有数。",
        },
        {
          icon: "✓",
          title: "周报营养板块",
          description: "周报多了一个营养维度的小结。",
        },
      ],
      nextStage: {
        number: 5,
        name: "持之以恒",
        description: "没有新规则，只剩你和伙伴一起把习惯过成日子。",
      },
      ctaLabel: "开始阶段 5",
    },
  },

  5: {
    start: {
      stage: 5,
      name: "持之以恒",
      badge: "阶段 5 · 持之以恒",
      title: "阶段 5 开始",
      subtitle: "和伙伴一起，过成日子",
      description:
        "本阶段没有新规则。继续按你已经习惯的节奏吃饭，伙伴会陪你走得更远。",
      illustration: "🌳",
      stats: [
        { label: "初始 HP", value: "50", sub: "5 颗爱心" },
        { label: "通关分数", value: "—", sub: "没有终点" },
        { label: "关键", value: "持续", sub: "回流 > 完美" },
      ],
      rulesTitle: "本阶段重点",
      rules: [
        {
          icon: "🔁",
          title: "保持节奏",
          description: "之前的规则全部继承，不再叠加新约束。",
        },
        {
          icon: "📔",
          title: "月度自我小结",
          description: "每月固定日，伙伴陪你回顾一个月的状态。",
        },
        {
          icon: "🤝",
          title: "回流不羞耻",
          description: "中断几天再回来也没关系，伙伴永远在原地等你。",
        },
      ],
      noteBanner: {
        icon: "🌱",
        text: "你已经走完了所有「关」——剩下的，是把习惯活成自己的一部分。",
      },
      ctaLabel: "开始阶段 5",
    },
    end: {
      stage: 5,
      name: "持之以恒",
      badge: "阶段 5 · 持之以恒",
      title: "阶段 5 完成",
      subtitle: "习惯已经长进你身体里",
      description:
        "你不再需要靠 App 提醒自己吃饭——伙伴的陪伴变成了你生活的一部分。",
      illustration: "🌟",
      accomplishmentsTitle: "你已完成",
      accomplishments: [
        {
          icon: "✓",
          title: "习惯成自然",
          description: "三餐 / 称重 / 运动 / 营养标签变成日常。",
        },
        {
          icon: "✓",
          title: "回流机制建立",
          description: "知道偶尔断了也能回来，不再有「放弃」感。",
        },
        {
          icon: "✓",
          title: "长期陪伴",
          description: "和伙伴的关系不再是任务，是一段关系。",
        },
      ],
      ctaLabel: "完成旅程",
    },
  },
};

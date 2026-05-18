// 五阶段过渡屏数据
//
// 模型简化（v0.5 task：删 stage-{2-5}-start）：
//   - stage 1 start：唯一的"开始屏"，新用户首次进 home 一次性弹
//   - stage N end（1-5）：advance 时弹（CTA 关闭直接回 home，不再串接 start）
//   - stage N demote（1-5）：HP < 0 时弹
//     · stage 1 demote 特殊：不变 stage，鼓励调（"加油，从头开始也没关系"）
//     · stage 2-5 demote：currentStage 回退到 N-1，文案 "回到阶段 N-1，请继续努力"
//
// 视觉模板：start/end 同 v0.4（Figma 100:977 / 100:5373）。
//   demote 用橘色调色板（StageDemoteScreen，区别 end 的绿色调），鼓励性 mascot。
// 数值统一 0–100 标度（与 useStore HP_MAX=100 对齐）。
// asset：illustration / icon 暂用 emoji 占位（后续按 Figma 替换）

import { HP_INITIAL_STAGE_1 } from "@src/store/useStore";

export type StageNumber = 1 | 2 | 3 | 4 | 5;

export type StageStat = {
  label: string;
  value: string;
  sub?: string;
};

export type StageRule = {
  icon: string;
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
  name: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  illustration: string;
  stats: [StageStat, StageStat, StageStat];
  rulesTitle: string;
  rules: StageRule[];
  noteBanner: { icon: string; text: string };
  ctaLabel: string;
};

export type StageEndConfig = {
  stage: StageNumber;
  name: string;
  badge: string;
  title: string;
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
  ctaLabel: string;
};

export type StageDemoteConfig = {
  stage: StageNumber;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  illustration: string;
  encouragementTitle: string;
  encouragements: StageAccomplishment[];
  ctaLabel: string;
};

// 注意：start 只在 stage 1 有；end + demote 五阶段都有
export const STAGE_TRANSITIONS: Record<
  StageNumber,
  { start?: StageStartConfig; end: StageEndConfig; demote: StageDemoteConfig }
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
      ctaLabel: "完成",
    },
    demote: {
      stage: 1,
      badge: "阶段 1 · 重整",
      title: "加油，从头开始也没关系",
      subtitle: "别灰心，今天重新来",
      description:
        "状态低谷是节奏的一部分。伙伴给你重置到 HP 90，先不计较过去，从下一餐重新开始。",
      illustration: "🌧️",
      encouragementTitle: "重新出发",
      encouragements: [
        {
          icon: "→",
          title: "HP 重置到 90",
          description: "给你一个充足的缓冲，今天先把节奏接回来。",
        },
        {
          icon: "→",
          title: "不计较过去",
          description: "已经错过的不再扣分，从下一餐开始算。",
        },
        {
          icon: "→",
          title: "需要更轻的话",
          description: "随时去设置打开温柔模式，扣分减半。",
        },
      ],
      ctaLabel: "我准备好了",
    },
  },

  2: {
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
      ctaLabel: "完成",
    },
    demote: {
      stage: 2,
      badge: "阶段 2 · 重整",
      title: "回到阶段 1，请继续努力",
      subtitle: "节奏掉了不要紧",
      description:
        "HP 一度降到 0 以下，伙伴先把你拉回阶段 1（坚持），等节奏稳了再回来。HP 重置到 90。",
      illustration: "🌧️",
      encouragementTitle: "回到阶段 1",
      encouragements: [
        {
          icon: "→",
          title: "回到「坚持」阶段",
          description: "重新聚焦在按时吃齐三餐这件事上。",
        },
        {
          icon: "→",
          title: "HP 重置到 90",
          description: "给你一个起步缓冲。",
        },
        {
          icon: "→",
          title: "再攒到 100 就回来",
          description: "走过一遍的路，第二遍会快很多。",
        },
      ],
      ctaLabel: "继续",
    },
  },

  3: {
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
      ctaLabel: "完成",
    },
    demote: {
      stage: 3,
      badge: "阶段 3 · 重整",
      title: "回到阶段 2，请继续努力",
      subtitle: "先稳「吃饱」这件事",
      description:
        "增重 + 运动的节奏暂时掉了，伙伴把你拉回阶段 2（量化），先把饱腹度和称重稳住再回来。HP 重置到 90。",
      illustration: "🌧️",
      encouragementTitle: "回到阶段 2",
      encouragements: [
        {
          icon: "→",
          title: "回到「量化」阶段",
          description: "暂时不要求每周增重，先保证吃饱 + 称重。",
        },
        {
          icon: "→",
          title: "HP 重置到 90",
          description: "给你一个起步缓冲。",
        },
        {
          icon: "→",
          title: "运动节奏休息一下",
          description: "等饱腹度回到 ≥ 7 再考虑加回运动。",
        },
      ],
      ctaLabel: "继续",
    },
  },

  4: {
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
      ctaLabel: "完成",
    },
    demote: {
      stage: 4,
      badge: "阶段 4 · 重整",
      title: "回到阶段 3，请继续努力",
      subtitle: "营养追踪可以暂时放一放",
      description:
        "营养标签的节奏跟不上很正常。伙伴把你拉回阶段 3（健康增重），先把吃饱 + 运动的循环稳住。HP 重置到 90。",
      illustration: "🌧️",
      encouragementTitle: "回到阶段 3",
      encouragements: [
        {
          icon: "→",
          title: "回到「健康增重」",
          description: "重新聚焦在每周增重 + 运动节奏。",
        },
        {
          icon: "→",
          title: "HP 重置到 90",
          description: "给你一个起步缓冲。",
        },
        {
          icon: "→",
          title: "营养标签下次再来",
          description: "等基本盘稳了，营养画像自然就跟上。",
        },
      ],
      ctaLabel: "继续",
    },
  },

  5: {
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
    demote: {
      stage: 5,
      badge: "阶段 5 · 重整",
      title: "回到阶段 4，请继续努力",
      subtitle: "长期阶段也允许波动",
      description:
        "习惯没有终点。HP 一度降到 0 以下，伙伴把你拉回阶段 4（营养），重新把节奏对齐一下。HP 重置到 90。",
      illustration: "🌧️",
      encouragementTitle: "回到阶段 4",
      encouragements: [
        {
          icon: "→",
          title: "回到「营养」阶段",
          description: "重新关注三餐的营养结构。",
        },
        {
          icon: "→",
          title: "HP 重置到 90",
          description: "给你一个起步缓冲。",
        },
        {
          icon: "→",
          title: "回流不羞耻",
          description: "阶段五的精神就是「断了也能回来」。",
        },
      ],
      ctaLabel: "继续",
    },
  },
};

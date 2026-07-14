import { autoYAxis, selectHpTimeline, selectStageTimeline, selectWeightTimeline, type TrendDataPoint } from "@src/store/selectors/stats";
import { useStore } from "@src/store/useStore";
import TrendChart from "@src/components/ui/TrendChart";

// v1.1 doc §七 Stats tab 公共组件
// 3 kinds × 3 windows = 9 视图
//
// stage 阶梯线渲染：TrendChart 现版用直线连接点，stage 1-5 离散值用直线
// 视觉上接近阶梯（中间没有插值，跳变看起来跟阶梯类似）。doc §十二 risk 9
// 未来加 <StepChart> 专用组件。

type Kind = "weight" | "stage" | "hp";
type Window = "week" | "month" | "all";

const WINDOW_DAYS: Record<Window, number | null> = {
  week: 7,
  month: 30,
  all: null,
};

const filterByWindow = (
  data: TrendDataPoint[],
  window: Window
): TrendDataPoint[] => {
  const days = WINDOW_DAYS[window];
  if (days == null) return data;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return data.filter((p) => (p.ts ?? 0) >= cutoff);
};

type Props = { kind: Kind; window: Window };

export default function StatsChart({ kind, window }: Props) {
  const weightHistory = useStore((s) => s.weightHistory);
  const hpHistory = useStore((s) => s.hpHistory);
  const stageHistory = useStore((s) => s.stageHistory);

  let raw: TrendDataPoint[];
  let yAxis: number[];
  let title: string;
  let subtitle: string;
  let emptyText: string;

  // v1.2.5 build 14: 文案改用户友好,去除 dev 技术词(advance/demote/init/addHp/Stage)。
  switch (kind) {
    case "weight":
      raw = filterByWindow(selectWeightTimeline({ weightHistory }), window);
      yAxis = autoYAxis(raw.map((p) => p.value));
      title = "体重变化";
      subtitle = "记录每一次的变化 · kg";
      emptyText = "还没有体重记录";
      break;
    case "hp":
      raw = filterByWindow(selectHpTimeline({ hpHistory }), window);
      yAxis = [0, 25, 50, 75, 100];
      title = "爱心变化";
      subtitle = "这段时间的状态走势";
      emptyText = "暂无爱心记录";
      break;
    case "stage":
      raw = filterByWindow(selectStageTimeline({ stageHistory }), window);
      yAxis = [1, 2, 3, 4, 5];
      title = "阶段变化";
      subtitle = "记录你走过的每一关";
      emptyText = "暂无阶段记录";
      break;
  }

  return (
    <TrendChart
      title={title}
      subtitle={subtitle}
      data={raw}
      yAxis={yAxis}
      emptyText={emptyText}
    />
  );
}

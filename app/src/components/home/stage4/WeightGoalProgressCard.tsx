import { selectStandardWeight } from "@src/store/selectors/standardWeight";
import { useStore } from "@src/store/useStore";
import { getHpBand } from "@src/theme/hp";
import { colors } from "@src/theme/tokens";
import { Image, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

// Stage 4 / 5 hero：圆环进度 + 文字 overlay + mascot
// Figma 59:297 参考。圆环 SVG 渲染：背景灰环 + 进度绿环（stroke-dasharray）
//
// F3 fix（r1）：进度公式 = (target - current) / (target - initial) * 100
//   语义 = "还差 X%"（current 越接近 target，% 越小）
//   - initial = weightHistory[0].kg（OPEN-R1-B 默认）
//   - 圆环填 "完成%" = 1 - 还差%，更符合"进度向满"直觉（OPEN-R1-A）
//   - label 显示 "还差 N%" + "距目标 Y kg"
//   - initial / current / target 任一缺 → 圆环填 0，label 显示 "—"
//
// F1+F2 fix（r1）：mascot 容器从 fixed 110×140 改成 width:100 + aspectRatio
//   wrapper（沿用 HomeStage2 模式），避免 image 超出 card 边界被裁
//
// stage 4 vs stage 5 差别只在 title/subtitle，由 props 传

type Props = {
  title: string;            // "你可以的" / "不朽印记"
  subtitle: string;         // hero 副标
  showProgress?: boolean;   // stage 5 hero 可能不显示圆环（设 false）
};

const RING_SIZE = 84;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

export default function WeightGoalProgressCard({
  title,
  subtitle,
  showProgress = true,
}: Props) {
  const height = useStore((s) => s.height);
  const ethnicity = useStore((s) => s.ethnicity);
  const targetWeight = useStore((s) => s.targetWeight);
  const weightHistory = useStore((s) => s.weightHistory);
  const hp = useStore((s) => s.hp);

  const standardWeight = selectStandardWeight({ height, ethnicity });
  const target = targetWeight ?? standardWeight ?? null;
  const lastWeight = weightHistory[weightHistory.length - 1]?.kg ?? null;
  // F3 OPEN-R1-B：initial = weightHistory[0].kg（第一条记录）
  const initialWeight = weightHistory[0]?.kg ?? null;

  // F3 公式：remainingPct = (target - current) / (target - initial)
  //   = 还差距离 / 总距离
  // completedPct = 1 - remainingPct（圆环填这个）
  // 已达标（current >= target）→ completedPct = 1，remainingPct = 0
  let completedPct = 0;
  let remainingPct = 1;
  let diffKg: number | null = null;
  let canComputePct = false;
  if (target != null && lastWeight != null && initialWeight != null) {
    const totalGap = target - initialWeight;
    const remainingGap = target - lastWeight;
    diffKg = Math.round(remainingGap * 10) / 10;
    if (Math.abs(totalGap) < 0.05) {
      // initial 已经在 target 上 → 视为已完成
      completedPct = 1;
      remainingPct = 0;
      canComputePct = true;
    } else {
      remainingPct = Math.min(1, Math.max(0, remainingGap / totalGap));
      completedPct = 1 - remainingPct;
      canComputePct = true;
    }
  }
  // 圆环显示完成%（更符合"进度向满"直觉，OPEN-R1-A 默认）
  const ringFillPct = completedPct;
  // label 显示"还差 N%"，避免歧义
  const remainPctLabel = canComputePct
    ? `${Math.round(remainingPct * 100)}%`
    : "—";
  const offsetDash = RING_CIRC * (1 - ringFillPct);

  return (
    <View
      style={{
        backgroundColor: "#E8F2D8",
        borderColor: "#D2DEB9",
        borderWidth: 1,
        borderRadius: 24,
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        minHeight: 160,
      }}
    >
      {/* 左：标题 + 副标 + 圆环进度 */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 28, fontWeight: "700", color: "#3D683F" }}
        >
          {title}
        </Text>
        <Text
          style={{ fontSize: 13, color: "#6E6F6C", marginTop: 6, lineHeight: 18 }}
        >
          {subtitle}
        </Text>

        {showProgress && (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
            {/* 圆环 */}
            <View style={{ width: RING_SIZE, height: RING_SIZE }}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="#FDFCF6"
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={colors.brand.green}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={RING_CIRC}
                  strokeDashoffset={offsetDash}
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
              </Svg>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {/* r1 OPEN-R1-A：xin 拍板 label 改成"完成 N%"，magnitude 仍是
                    remainingPct (例 60→65 当前 62 → 60%)。语义反直觉（"完成"
                    应从 0→100），doc 里二次确认 TODO */}
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#3D683F" }}>
                  完成 {remainPctLabel}
                </Text>
              </View>
            </View>
            {/* 副 label：完成 X% + 距目标 Ykg */}
            <View style={{ marginLeft: 12 }}>
              {canComputePct && (
                <Text style={{ fontSize: 13, color: "#6E6F6C" }}>
                  完成 {remainPctLabel}
                </Text>
              )}
              {diffKg != null && (
                <Text
                  style={{ fontSize: 12, color: colors.ink.sub, marginTop: 2 }}
                >
                  距目标 {diffKg > 0 ? diffKg : 0}kg
                </Text>
              )}
              {!canComputePct && (
                <Text style={{ fontSize: 12, color: colors.brand.accentDark }}>
                  {target == null ? "请先设目标" : "等首次称重"}
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* 右：mascot（按 HP band；F1+F2 fix：HomeStage2 模式 wrapper + aspectRatio） */}
      <View style={{ width: 100, marginLeft: 8 }}>
        <View
          style={{ width: "100%", aspectRatio: getHpBand(hp).mascotAspect }}
        >
          <Image
            source={getHpBand(hp).mascot}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

import { selectStandardWeight } from "@src/store/selectors/standardWeight";
import { useStore } from "@src/store/useStore";
import { getHpBand } from "@src/theme/hp";
import { colors } from "@src/theme/tokens";
import { Image, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

// Stage 4 / 5 hero：圆环进度 + 文字 overlay + mascot
// Figma 59:297 参考。圆环 SVG 渲染：背景灰环 + 进度绿环（stroke-dasharray）
//
// F3 fix（r1 r3）：进度公式 = (current - initial) / (target - initial) * 100
//   真完成% 语义（xin r3 2026-05-30 拍板）：
//   - 0% = current 等于 initial（还没开始）
//   - 100% = current 达到 target
//   - label 显示 "完成 N%"（语义现在对了）
//   - initial = weightHistory[0].kg（OPEN-R1-B 默认）
//   - 副 label 显示 "距目标 Y kg"
//   - edge case:
//     * target === initial → div by 0 → 完成 0% (fallback)
//     * current < initial（还退步了）→ clamp 0%
//     * current > target（超目标）→ clamp 100%（未来可加"超出 +X kg"副标）
//     * initial / current / target 任一缺 → 圆环 0% + label "—"
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

  // F3 r3 真完成%：(current - initial) / (target - initial)
  //   0% = current 等于 initial；100% = current 达到 target
  let completedPct = 0;
  let diffKg: number | null = null;
  let canComputePct = false;
  if (target != null && lastWeight != null && initialWeight != null) {
    const totalGap = target - initialWeight;
    diffKg = Math.round((target - lastWeight) * 10) / 10;
    if (Math.abs(totalGap) < 0.05) {
      // initial 已经在 target 上 → div by 0 兜底 0%
      completedPct = 0;
    } else {
      const raw = (lastWeight - initialWeight) / totalGap;
      // clamp 0..1：current<initial 退步 → 0；current>target 超目标 → 100
      completedPct = Math.min(1, Math.max(0, raw));
    }
    canComputePct = true;
  }
  const ringFillPct = completedPct;
  const completedPctLabel = canComputePct
    ? `${Math.round(completedPct * 100)}%`
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
                {/* r1 F3 r3：真完成% = (current-initial)/(target-initial)
                    label "完成 N%"，语义现在对了（0→100 向满）*/}
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#3D683F" }}>
                  完成 {completedPctLabel}
                </Text>
              </View>
            </View>
            {/* 副 label：完成 X% + 距目标 Ykg */}
            <View style={{ marginLeft: 12 }}>
              {canComputePct && (
                <Text style={{ fontSize: 13, color: "#6E6F6C" }}>
                  完成 {completedPctLabel}
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

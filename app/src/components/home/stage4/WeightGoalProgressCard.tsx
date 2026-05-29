import { selectStandardWeight } from "@src/store/selectors/standardWeight";
import { useStore } from "@src/store/useStore";
import { getHpBand } from "@src/theme/hp";
import { colors } from "@src/theme/tokens";
import { Image, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

// Stage 4 / 5 hero：圆环进度（current / target）+ 文字 overlay + mascot
// Figma 59:297 参考。圆环 SVG 渲染：背景灰环 + 进度绿环（stroke-dasharray）
//
// 进度计算：currentWeight / targetWeight。targetWeight 缺 → 显示"-" 提示设目标
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

  // 进度 = current / target (capped 0-1)
  let pct = 0;
  let diffKg: number | null = null;
  if (target != null && lastWeight != null) {
    pct = Math.min(1, Math.max(0, lastWeight / target));
    diffKg = Math.round((target - lastWeight) * 10) / 10;
  }
  const pctLabel = target != null && lastWeight != null
    ? `${Math.round(pct * 100)}%`
    : "—";
  const offsetDash = RING_CIRC * (1 - pct);

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
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#3D683F" }}>
                  {pctLabel}
                </Text>
              </View>
            </View>
            {/* 副 label */}
            <View style={{ marginLeft: 12 }}>
              {diffKg != null && (
                <Text style={{ fontSize: 13, color: "#6E6F6C" }}>
                  距目标 {diffKg > 0 ? diffKg : 0}kg
                </Text>
              )}
              {target == null && (
                <Text style={{ fontSize: 12, color: colors.brand.accentDark }}>
                  请先设目标
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* 右：mascot（按 HP band，stage 4/5 沿用 stage 2 资源；doc §十二 risk 1 TODO） */}
      <View style={{ width: 110, height: 140, marginLeft: 8, justifyContent: "flex-end" }}>
        <Image
          source={getHpBand(hp).mascot}
          style={{ width: "100%", aspectRatio: getHpBand(hp).mascotAspect }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

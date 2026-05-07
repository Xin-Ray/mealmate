import { useState } from "react";
import { View, Text, type LayoutChangeEvent } from "react-native";
import Svg, { G, Path, Circle, Line, Text as SvgText } from "react-native-svg";
import Card from "@src/components/ui/Card";
import { colors } from "@src/theme/tokens";

// 趋势图（PRD §11.E）— 用 react-native-svg 画散点 + 连线 + Y 轴格线 + X 轴标签。
//
// 稀疏数据降级：
//   有效点（value !== null）画实心圆 + 数字
//   无效点（value === null）画空心圆 + 灰色描边
//   仅 1 个有效点 → 不画连线 + 显示 hint 文案
//   ≥ 2 个有效点 → 用直线段连接相邻有效点（跳过 null 点）

export type TrendPoint = {
  stage: number;
  value: number | null; // null = 未到达 / 无录入
  bandLabel: string;    // "满血" / "平稳" 等
  display?: string;     // 自定义显示数字（如 "63.0"）；缺省用 value.toString()
};

type Props = {
  title: string;
  subtitle?: string;
  switcherLabel?: string; // 右上 pill（disabled，预留 v0.5 切换）
  dataPoints: TrendPoint[];
  yAxis: number[];        // [0, 2, ..., 12] 或 auto
  height?: number;
};

const CHART_PAD_LEFT = 36;
const CHART_PAD_RIGHT = 8;
const CHART_PAD_TOP = 16;
const CHART_PAD_BOTTOM = 44;

export default function TrendChart({
  title,
  subtitle,
  switcherLabel,
  dataPoints,
  yAxis,
  height = 220,
}: Props) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const yMin = yAxis[0];
  const yMax = yAxis[yAxis.length - 1];
  const plotW = Math.max(0, width - CHART_PAD_LEFT - CHART_PAD_RIGHT);
  const plotH = height - CHART_PAD_TOP - CHART_PAD_BOTTOM;

  // 计算每个数据点的 (x, y) 像素位置
  const positioned = dataPoints.map((pt, i) => {
    const xPct = dataPoints.length === 1 ? 0.5 : i / (dataPoints.length - 1);
    const x = CHART_PAD_LEFT + xPct * plotW;
    const y =
      pt.value === null
        ? CHART_PAD_TOP + plotH / 2
        : CHART_PAD_TOP +
          (1 - (pt.value - yMin) / (yMax - yMin)) * plotH;
    return { ...pt, x, y };
  });

  const validPoints = positioned.filter((p) => p.value !== null);

  // 直线段连线（跳过 null 点）
  const linePath = validPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <Card style={{ marginBottom: 20 }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text
            className="font-semibold"
            style={{ fontSize: 18, color: colors.ink.primary }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className="mt-1"
              style={{ fontSize: 12, color: colors.ink.sub }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {switcherLabel && (
          <View
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: colors.bg.hpEmpty,
              opacity: 0.6,
            }}
          >
            <Text className="text-xs" style={{ color: colors.ink.sub }}>
              {switcherLabel}
            </Text>
          </View>
        )}
      </View>

      <View onLayout={onLayout} style={{ marginTop: 12 }}>
        {width > 0 && (
          <Svg width={width} height={height}>
            {/* Y 轴格线 + label */}
            {yAxis.map((tick) => {
              const y =
                CHART_PAD_TOP +
                (1 - (tick - yMin) / (yMax - yMin)) * plotH;
              return (
                <G key={tick}>
                  <Line
                    x1={CHART_PAD_LEFT}
                    y1={y}
                    x2={width - CHART_PAD_RIGHT}
                    y2={y}
                    stroke={colors.border.card}
                    strokeWidth={1}
                    strokeDasharray="3,4"
                  />
                  <SvgText
                    x={CHART_PAD_LEFT - 6}
                    y={y + 3}
                    fontSize={10}
                    fill={colors.ink.muted}
                    textAnchor="end"
                  >
                    {tick}
                  </SvgText>
                </G>
              );
            })}

            {/* 数据点之间连线（跳 null） */}
            {validPoints.length >= 2 && (
              <Path
                d={linePath}
                stroke={colors.brand.green}
                strokeWidth={2}
                fill="none"
              />
            )}

            {/* 数据点 + X 轴标签 */}
            {positioned.map((pt) => {
              const isValid = pt.value !== null;
              return (
                <G key={pt.stage}>
                  {isValid ? (
                    <>
                      <Circle
                        cx={pt.x}
                        cy={pt.y}
                        r={14}
                        fill={colors.brand.green}
                      />
                      <SvgText
                        x={pt.x}
                        y={pt.y + 4}
                        fontSize={11}
                        fontWeight="600"
                        fill="#FFFFFF"
                        textAnchor="middle"
                      >
                        {pt.display ?? String(pt.value)}
                      </SvgText>
                    </>
                  ) : (
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r={10}
                      stroke={colors.ink.muted}
                      strokeWidth={1.5}
                      strokeDasharray="2,2"
                      fill="transparent"
                    />
                  )}
                  {/* X 轴 label：stage 编号 + band 名 */}
                  <SvgText
                    x={pt.x}
                    y={CHART_PAD_TOP + plotH + 18}
                    fontSize={10}
                    fill={colors.ink.sub}
                    textAnchor="middle"
                  >
                    {pt.stage}
                  </SvgText>
                  <SvgText
                    x={pt.x}
                    y={CHART_PAD_TOP + plotH + 32}
                    fontSize={10}
                    fill={colors.ink.muted}
                    textAnchor="middle"
                  >
                    {pt.bandLabel}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        )}
      </View>

      {validPoints.length === 1 && (
        <Text
          className="text-center mt-2"
          style={{ fontSize: 12, color: colors.ink.muted }}
        >
          再坚持几天就能看到趋势啦~
        </Text>
      )}
    </Card>
  );
}

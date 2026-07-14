import { useState } from "react";
import { View, Text, type LayoutChangeEvent } from "react-native";
import Svg, { G, Path, Circle, Line, Text as SvgText } from "react-native-svg";
import Card from "@src/components/ui/Card";
import { colors } from "@src/theme/tokens";

// 趋势图（PRD §11.E v0.4 hotfix#12 重写）— 时间序列散点 + 连线 + Y 轴格线 + X 轴 MM-DD 标签。
//
// X 轴：data 里所有 date 等距分布（按时间序，1..7 个 label，过多则均匀抽样）。
//
// 状态：
//   data.length === 0  → 中央空态文案，不画任何点 / 圆 / 网格
//   data.length === 1  → 实心圆点 + 数字 + 中央 hint "再记录几天就能看到趋势啦~"
//   data.length ≥ 2    → 散点 + svg path 连线
//
// 不再画"空心虚线圆占位"——稀疏数据 / 空数据走 hint 文案。

export type TrendDataPoint = {
  date: string;       // YYYY-MM-DD
  value: number;
  display?: string;   // 自定义显示数字（如 "63.0"）；缺省 String(value)
};

type Props = {
  title: string;
  subtitle?: string;
  data: TrendDataPoint[];
  yAxis: number[];        // [0, 2, ..., 12] 或 auto
  height?: number;
  emptyText?: string;     // data.length === 0 时显示的占位文案
};

// v1.2.5 build 14: 右边数据点 + 日期 label clip 问题修
// 原 CHART_PAD_RIGHT=8 太小,最后一个点的 textAnchor=middle 日期 label 会半个字
// 超出卡片右边 → 看到「06-0」缺尾巴。改 28 留半个 label 的安全距。CHART_PAD_LEFT
// 同步加 4 视觉对称。
const CHART_PAD_LEFT = 40;
const CHART_PAD_RIGHT = 28;
const CHART_PAD_TOP = 16;
const CHART_PAD_BOTTOM = 36;
const MAX_X_LABELS = 6;

// "YYYY-MM-DD" → "M/D"(更短,跟 xin spec 一致)
const fmtMD = (date: string): string => {
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return `${m}/${d}`;
};

// 等距抽样 indices：[0..n-1] 取最多 maxLabels 个，首尾必含
const pickLabelIndices = (n: number, maxLabels: number): number[] => {
  if (n <= maxLabels) return Array.from({ length: n }, (_, i) => i);
  const step = (n - 1) / (maxLabels - 1);
  const set = new Set<number>();
  for (let i = 0; i < maxLabels; i++) set.add(Math.round(i * step));
  return Array.from(set).sort((a, b) => a - b);
};

export default function TrendChart({
  title,
  subtitle,
  data,
  yAxis,
  height = 220,
  emptyText = "暂无数据，开始记录就能看到趋势啦~",
}: Props) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const yMin = yAxis[0];
  const yMax = yAxis[yAxis.length - 1];
  const plotW = Math.max(0, width - CHART_PAD_LEFT - CHART_PAD_RIGHT);
  const plotH = height - CHART_PAD_TOP - CHART_PAD_BOTTOM;

  const positioned = data.map((pt, i) => {
    const xPct = data.length === 1 ? 0.5 : i / (data.length - 1);
    const x = CHART_PAD_LEFT + xPct * plotW;
    const y =
      CHART_PAD_TOP + (1 - (pt.value - yMin) / (yMax - yMin)) * plotH;
    return { ...pt, x, y };
  });

  const linePath = positioned
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const labelIndices = pickLabelIndices(data.length, MAX_X_LABELS);

  const isEmpty = data.length === 0;

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
      </View>

      <View onLayout={onLayout} style={{ marginTop: 12, height }}>
        {isEmpty ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: colors.ink.muted,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {emptyText}
            </Text>
          </View>
        ) : (
          width > 0 && (
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

              {/* 连线 */}
              {positioned.length >= 2 && (
                <Path
                  d={linePath}
                  stroke={colors.brand.green}
                  strokeWidth={2}
                  fill="none"
                />
              )}

              {/* 数据点(v1.2.5 build 14: r=14→11,小一点不压视觉) */}
              {positioned.map((pt, i) => (
                <G key={`${pt.date}-${i}`}>
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={11}
                    fill={colors.brand.green}
                  />
                  <SvgText
                    x={pt.x}
                    y={pt.y + 3.5}
                    fontSize={10}
                    fontWeight="600"
                    fill="#FFFFFF"
                    textAnchor="middle"
                  >
                    {pt.display ?? String(pt.value)}
                  </SvgText>
                </G>
              ))}

              {/* X 轴 MM-DD label：仅在抽样 indices 上画 */}
              {labelIndices.map((idx) => {
                const pt = positioned[idx];
                return (
                  <SvgText
                    key={`xl-${idx}`}
                    x={pt.x}
                    y={CHART_PAD_TOP + plotH + 18}
                    fontSize={10}
                    fill={colors.ink.sub}
                    textAnchor="middle"
                  >
                    {fmtMD(pt.date)}
                  </SvgText>
                );
              })}
            </Svg>
          )
        )}
      </View>

      {data.length === 1 && (
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

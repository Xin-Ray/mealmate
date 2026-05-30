import { Alert, Pressable, Text, View } from "react-native";
import Card from "@src/components/ui/Card";
import { colors } from "@src/theme/tokens";

// r1 F7+F8 ExerciseCard 骨架（stage 3/4/5 用）
//
// ⚠️ TODO OPEN-R1-C: 运动数据字段未决，本组件只是 UI 占位。
//   - exerciseHistory 字段在 store 还没加
//   - 数值"今日 0/1 次"是硬编码占位（之后改成 selector）
//   - 拍照 flow（(modal)/exercise.tsx）还没建，按钮 onPress 弹 Alert
// 等 xin 拍 OPEN-R1-C 决定数据结构后再接 store + 实现拍照 flow。
//
// 样式跟 WeightCard 对齐：整卡 Pressable + 左标题/副标 + 右绿底相机圆头

export default function ExerciseCard() {
  // TODO OPEN-R1-C: 替换成 selectTodayExerciseProgress(state)
  const todayDone = 0;
  const todayTarget = 1;

  const onPress = () => {
    Alert.alert(
      "运动拍照",
      "运动记录功能开发中，等 PRD 确认数据字段后开放。"
    );
  };

  return (
    <Card onPress={onPress} style={{ marginTop: 16 }}>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sub text-xs">今日运动</Text>
          <Text
            className="font-semibold mt-1"
            style={{ fontSize: 32, color: colors.ink.primary }}
          >
            {todayDone}/{todayTarget} 次
          </Text>
          <Text className="text-sub text-xs mt-1">
            点击拍照打卡（功能开发中）
          </Text>
        </View>
        {/* 相机圆头 — 跟 WeightCard 同款 CTA */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.brand.green,
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.6, // 半透明提示"还没接通"
          }}
        >
          <Text style={{ fontSize: 22 }}>📷</Text>
        </View>
      </View>
    </Card>
  );
}

import { View, Text, Pressable } from "react-native";
import { colors } from "@src/theme/tokens";
import type { FullnessScore } from "@src/types";

// 餐后饱腹度 3 选 1（PRD §11.D.1）
//
// 视觉（按 Figma 1:171）：
// - 卡片底色 #F6F8EB（浅绿）/ 边框 #EDEFDE / 圆角 39
// - 选中态：底色加深（colors.brand.green / 20%）+ 边框 brand.green
// - 左侧圆形 emoji icon + 中间文字 + 右侧选中点

type Option = {
  score: FullnessScore;
  emoji: string;
  label: string;
};

const OPTIONS: Option[] = [
  { score: 3, emoji: "😞", label: "感觉不太好，只吃了不到 4 分" },
  { score: 5, emoji: "😐", label: "感觉还行，吃了 5 分" },
  { score: 8, emoji: "😊", label: "吃的饱饱的，吃了 8 分呢" },
];

type Props = {
  selectedScore?: FullnessScore;
  onSelect: (score: FullnessScore) => void;
};

const UNSELECTED_BG = "#F6F8EB";
const UNSELECTED_BORDER = "#EDEFDE";

export default function FullnessRatingPicker({ selectedScore, onSelect }: Props) {
  return (
    <View className="gap-3">
      {OPTIONS.map((opt) => {
        const isSelected = selectedScore === opt.score;
        return (
          <Pressable
            key={opt.score}
            onPress={() => onSelect(opt.score)}
            className="flex-row items-center px-4 py-3 rounded-[39px]"
            style={{
              backgroundColor: isSelected
                ? `${colors.brand.green}33`
                : UNSELECTED_BG,
              borderWidth: 1,
              borderColor: isSelected ? colors.brand.green : UNSELECTED_BORDER,
            }}
          >
            <View
              className="items-center justify-center rounded-full mr-3"
              style={{
                width: 40,
                height: 40,
                backgroundColor: colors.bg.card,
              }}
            >
              <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
            </View>
            <Text
              className="flex-1"
              style={{
                fontSize: 14,
                color: isSelected ? colors.brand.greenDark : colors.ink.primary,
                fontWeight: isSelected ? "600" : "400",
              }}
            >
              {opt.label}
            </Text>
            <View
              className="rounded-full"
              style={{
                width: 14,
                height: 14,
                borderWidth: 2,
                borderColor: isSelected ? colors.brand.green : colors.ink.muted,
                backgroundColor: isSelected ? colors.brand.green : "transparent",
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

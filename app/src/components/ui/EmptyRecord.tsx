import { View, Text } from "react-native";
import { colors } from "@src/theme/tokens";

// 记录空态卡：HomeStage1 / HomeStage2 / Records 共用，避免三处重复。
//
// emoji 默认 🍙，但可传 prop 改（比如统计页可能用 📊）。

type Props = {
  text?: string;
  emoji?: string;
};

export default function EmptyRecord({
  text = "今天还没有记录，等等就要吃饭啦！",
  emoji = "🍙",
}: Props) {
  return (
    <View
      className="px-5 py-8 rounded-2xl items-center"
      style={{
        backgroundColor: colors.bg.card,
        borderWidth: 1,
        borderColor: colors.border.card,
      }}
    >
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
      <Text className="text-sub text-sm mt-3 text-center">{text}</Text>
    </View>
  );
}

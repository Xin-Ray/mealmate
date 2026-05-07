import { View, Pressable, type ViewStyle } from "react-native";
import { colors } from "@src/theme/tokens";
import type { ReactNode } from "react";

// 通用卡片包装：bg.card / 16 圆角 / border.card 1px
// 可点击时传 onPress（内部用 Pressable 包一层）

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  className?: string;
};

const baseStyle: ViewStyle = {
  backgroundColor: colors.bg.card,
  borderColor: colors.border.card,
  borderWidth: 1,
  borderRadius: 16,
  paddingHorizontal: 20,
  paddingVertical: 16,
};

export default function Card({ children, onPress, style, className }: Props) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[baseStyle, style]} className={className}>
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[baseStyle, style]} className={className}>
      {children}
    </View>
  );
}

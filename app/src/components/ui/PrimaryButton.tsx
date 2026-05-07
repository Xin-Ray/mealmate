import { Pressable, Text } from "react-native";
import { colors } from "@src/theme/tokens";

// 主 CTA 按钮：brand.green bg / white 文字 / 16 圆角
// disabled 时降饱和（hpEmpty bg + sub 文字 + 60% opacity）

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function PrimaryButton({ label, onPress, disabled = false }: Props) {
  return (
    <Pressable
      onPress={() => {
        if (!disabled) onPress();
      }}
      disabled={disabled}
      className="py-4 items-center rounded-2xl"
      style={{
        backgroundColor: disabled ? colors.bg.hpEmpty : colors.brand.green,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text
        className="font-semibold"
        style={{
          fontSize: 18,
          color: disabled ? colors.ink.sub : "#FFFFFF",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

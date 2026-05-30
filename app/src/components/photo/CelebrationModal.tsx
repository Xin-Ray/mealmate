import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { getHpBand } from "@src/theme/hp";
import { useStore } from "@src/store/useStore";
import { Image } from "react-native";

// v1.1 doc §八：拍照庆祝弹窗（Figma 32:1637）
// 白卡 + mascot + 两侧❤️装饰 + 文案 + 血量+N + 继续加油 button
// 600ms 总动画，可点屏跳过。Reanimated v4 手写，不引新库。
//
// 时序（doc §八）：
//   t=0    : 弹窗 scale 0.85→1.0 + opacity 0→1（180ms ease-out）
//   t=120ms: mascot bounce translateY 0→-8→0，2 cycles（240ms total）
//   t=200ms: "+N" 浮字 zoom in + translateY 0→-20 fadeout（400ms ease-in）
//   t=200ms: 心形左右轻摆 ±10°，3 cycles（400ms）
//
// 敏感人群约束（doc §八）：
//   - 不用 confetti
//   - 不用"赢了/成功"类词
//   - 文案温和（"太棒了" "继续加油" 已在边界，文案池由 photo.tsx 决定）
//   - 时长短，可跳过

type Props = {
  visible: boolean;
  hpDelta: number;            // +5 (meal) / +10 (snack)
  title: string;              // "太棒了！"（hardcoded in component）
  doneLine: string;           // "早餐看起来很健康呢！" 等
  onContinue: () => void;
};

export default function CelebrationModal({
  visible,
  hpDelta,
  title,
  doneLine,
  onContinue,
}: Props) {
  const hp = useStore((s) => s.hp);
  const band = getHpBand(hp);

  // 动画 shared values
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);
  const mascotY = useSharedValue(0);
  const hpDeltaY = useSharedValue(0);
  const hpDeltaOpacity = useSharedValue(0);
  const heartRot = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      // 重置
      cardScale.value = 0.85;
      cardOpacity.value = 0;
      mascotY.value = 0;
      hpDeltaY.value = 0;
      hpDeltaOpacity.value = 0;
      heartRot.value = 0;
      return;
    }

    // t=0: 弹窗出现
    cardScale.value = withSpring(1, { damping: 14, stiffness: 180 });
    cardOpacity.value = withTiming(1, {
      duration: 180,
      easing: Easing.out(Easing.quad),
    });

    // t=120ms: mascot bounce (2 cycles)
    mascotY.value = withDelay(
      120,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 60, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 60, easing: Easing.in(Easing.quad) })
        ),
        2,
        false
      )
    );

    // t=200ms: "+N" 浮字 zoom in（用 opacity + translateY）
    hpDeltaOpacity.value = withDelay(
      200,
      withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 250, easing: Easing.in(Easing.quad) })
      )
    );
    hpDeltaY.value = withDelay(
      200,
      withTiming(-20, { duration: 400, easing: Easing.out(Easing.quad) })
    );

    // t=200ms: 心形左右轻摆（3 cycles）
    heartRot.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(10, { duration: 70 }),
          withTiming(-10, { duration: 70 }),
          withTiming(0, { duration: 70 })
        ),
        3,
        false
      )
    );

    return () => {
      cancelAnimation(cardScale);
      cancelAnimation(cardOpacity);
      cancelAnimation(mascotY);
      cancelAnimation(hpDeltaOpacity);
      cancelAnimation(hpDeltaY);
      cancelAnimation(heartRot);
    };
    // visible 是唯一 dep；refs 都是 stable shared values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const skipToEnd = () => {
    cardScale.value = 1;
    cardOpacity.value = 1;
    mascotY.value = 0;
    hpDeltaY.value = -20;
    hpDeltaOpacity.value = 0;
    heartRot.value = 0;
  };

  const dismiss = () => {
    cardOpacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(onContinue)();
    });
  };

  const cardAStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const mascotAStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: mascotY.value }],
  }));
  const hpDeltaAStyle = useAnimatedStyle(() => ({
    opacity: hpDeltaOpacity.value,
    transform: [{ translateY: hpDeltaY.value }],
  }));
  const heartLeftAStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${heartRot.value}deg` }],
  }));
  const heartRightAStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-heartRot.value}deg` }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Pressable
        style={styles.backdrop}
        onPress={skipToEnd}
        accessibilityLabel="跳过动画"
      >
        <Animated.View style={[styles.card, cardAStyle]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.doneLine}>{doneLine}</Text>

          {/* mascot + 两侧心形 */}
          <View style={styles.mascotRow}>
            <Animated.Text style={[styles.heart, heartLeftAStyle]}>
              ❤️
            </Animated.Text>
            <Animated.View style={[styles.mascotWrap, mascotAStyle]}>
              <Image
                source={band.mascot}
                style={{ width: 96, aspectRatio: band.mascotAspect }}
                resizeMode="contain"
              />
            </Animated.View>
            <Animated.Text style={[styles.heart, heartRightAStyle]}>
              ❤️
            </Animated.Text>
          </View>

          {/* HP delta + 浮字 */}
          <View style={styles.hpRow}>
            <Text style={styles.hpLabel}>💚 血量 +{hpDelta}</Text>
            <Animated.Text style={[styles.hpFloating, hpDeltaAStyle]}>
              +{hpDelta}
            </Animated.Text>
          </View>

          <Pressable
            onPress={dismiss}
            style={styles.btn}
            accessibilityLabel="继续加油"
          >
            <Text style={styles.btnText}>继续加油！</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3D683F",
    marginBottom: 6,
  },
  doneLine: {
    fontSize: 14,
    color: "#6E6F6C",
    marginBottom: 16,
    textAlign: "center",
  },
  mascotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  mascotWrap: {
    marginHorizontal: 16,
  },
  heart: {
    fontSize: 22,
  },
  hpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    position: "relative",
  },
  hpLabel: {
    fontSize: 16,
    color: "#3D683F",
    fontWeight: "600",
  },
  hpFloating: {
    position: "absolute",
    fontSize: 18,
    fontWeight: "700",
    color: "#3D683F",
    right: -28,
  },
  btn: {
    backgroundColor: "#60883b",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: "stretch",
    alignItems: "center",
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

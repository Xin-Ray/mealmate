// 拍照庆祝弹窗 — v1.2.3 UI 升级(参考 xin image 2 reference)。
//
// 视觉:
// - 白卡 + 圆角 + 强阴影
// - 顶部绿圆 ✓ badge,半压在卡顶边缘
// - 标题「太棒了！」+ 小 ✓
// - 副标 doneLine(如「记下了这份炒饭 ✓」)
// - mascot 在卡内独立 box(浅米底 + 圆角,thumbs-up 男孩,见 assets/mascot/celebration.png)
// - 绿心 + 「血量 +10」
// - 绿 pill CTA「继续加油！」
//
// 动画沿用 v1.1:
//   t=0    : 卡 scale 0.85→1.0 + opacity 0→1(180ms ease-out)
//   t=120ms: mascot bounce translateY 0→-8→0(2 cycles)
//   t=200ms: 「+N」浮字 zoom in + fadeout(400ms)
//   t=200ms: 心形 ±10° 左右轻摆(3 cycles)
//
// 敏感人群约束(doc §八):无 confetti,无"赢/成功"词,文案温和,可点屏跳过。
//
// React Compiler 注意:Pressable style 用 plain object,不用函数式(见
// memory feedback_react_compiler_pressable.md)。

import { useEffect } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

const CELEBRATION_MASCOT = require("../../../assets/mascot/celebration.png");

type Props = {
  visible: boolean;
  hpDelta: number; // +5 / +10
  title: string;
  doneLine: string;
  onContinue: () => void;
};

export default function CelebrationModal({
  visible,
  hpDelta,
  title,
  doneLine,
  onContinue,
}: Props) {
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);
  const mascotY = useSharedValue(0);
  const hpDeltaY = useSharedValue(0);
  const hpDeltaOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      cardScale.value = 0.85;
      cardOpacity.value = 0;
      mascotY.value = 0;
      hpDeltaY.value = 0;
      hpDeltaOpacity.value = 0;
      badgeScale.value = 0;
      return;
    }

    cardScale.value = withSpring(1, { damping: 14, stiffness: 180 });
    cardOpacity.value = withTiming(1, {
      duration: 180,
      easing: Easing.out(Easing.quad),
    });

    // badge ✓ 弹入(略晚于卡)
    badgeScale.value = withDelay(
      80,
      withSpring(1, { damping: 10, stiffness: 200 })
    );

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

    return () => {
      cancelAnimation(cardScale);
      cancelAnimation(cardOpacity);
      cancelAnimation(mascotY);
      cancelAnimation(hpDeltaOpacity);
      cancelAnimation(hpDeltaY);
      cancelAnimation(badgeScale);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const skipToEnd = () => {
    cardScale.value = 1;
    cardOpacity.value = 1;
    mascotY.value = 0;
    hpDeltaY.value = -20;
    hpDeltaOpacity.value = 0;
    badgeScale.value = 1;
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
  const badgeAStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
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
        {/* v1.2.4 P0 fix: 真机上 mascot aspectRatio+maxHeight 不靠谱让 card 超过
            viewport → 居中溢出 top/bottom 同时被切(title + badge + CTA 看不见)。
            修法:
            (a) mascotBox 用 fixed height(180px),Image width:100% height:100% +
                resizeMode contain → 内部图自适应不撑爆
            (b) card 包 ScrollView 兜底极小屏 / 大字体时仍可滚出 CTA
            (c) badge 加 left:50% + marginLeft 真正居中(原来缺 left/right 默认靠左) */}
        <Animated.View style={[styles.card, cardAStyle]}>
          {/* 顶部 ✓ 圆形 badge — 真正水平居中 */}
          <Animated.View style={[styles.badge, badgeAStyle]}>
            <Text style={styles.badgeCheck}>✓</Text>
          </Animated.View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* 标题 + 小 ✓ */}
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.titleCheck}> ✓</Text>
            </View>

            {/* 副标 */}
            <Text style={styles.doneLine}>{doneLine}</Text>

            {/* mascot 独立 box:fixed height 180,Image fill 内部 contain */}
            <Animated.View style={[styles.mascotBox, mascotAStyle]}>
              <Image
                source={CELEBRATION_MASCOT}
                style={styles.mascotImg}
                resizeMode="contain"
              />
            </Animated.View>

            {/* 绿心 + 血量 +N */}
            <View style={styles.hpRow}>
              <Text style={styles.hpHeart}>💚</Text>
              <Text style={styles.hpLabel}>血量 +{hpDelta}</Text>
              <Animated.Text style={[styles.hpFloating, hpDeltaAStyle]}>
                +{hpDelta}
              </Animated.Text>
            </View>

            {/* CTA 继续加油 — plain object style,避免 RC swallow */}
            <Pressable
              onPress={dismiss}
              style={styles.btn}
              accessibilityLabel="继续加油"
            >
              <Text style={styles.btnText}>继续加油！</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const BADGE_SIZE = 48;
const MASCOT_BOX_HEIGHT = 180;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingTop: 40,
    paddingBottom: 0, // ScrollView contentContainer 补底 padding
    paddingHorizontal: 22,
    width: "100%",
    maxHeight: "92%", // 真机兜底:不超 backdrop 高度 92%,防溢出切边
    // 强阴影
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  scroll: {
    width: "100%",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 24,
  },
  badge: {
    position: "absolute",
    top: -BADGE_SIZE / 2,
    left: "50%",
    marginLeft: -BADGE_SIZE / 2, // 真正水平居中(原来没 left/right 默认 left:0 靠左)
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: "#60883b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    zIndex: 10, // 真机叠在 ScrollView 之上
  },
  badgeCheck: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3D683F",
  },
  titleCheck: {
    fontSize: 18,
    color: "#60883b",
  },
  doneLine: {
    fontSize: 14,
    color: "#6E6F6C",
    marginTop: 6,
    marginBottom: 18,
    textAlign: "center",
  },
  mascotBox: {
    backgroundColor: "#F4F8E8",
    borderRadius: 20,
    padding: 12,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    height: MASCOT_BOX_HEIGHT, // FIXED height,不靠 aspectRatio(真机不稳)
  },
  mascotImg: {
    width: "100%",
    height: "100%", // 填满 mascotBox,resizeMode contain 让图自适应不变形
  },
  hpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    position: "relative",
    gap: 6,
  },
  hpHeart: {
    fontSize: 18,
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
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignSelf: "stretch",
    alignItems: "center",
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});

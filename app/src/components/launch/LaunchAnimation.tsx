// 启动动画 (v1.2.3 改动 #4) — 每次冷启动播 ~3s 标志性 splash 视频。
//
// 实现:
// - expo-av <Video /> 全屏覆盖
// - 视频结束 (didJustFinish) 或用户点屏 → 400ms 淡出 → unmount(调 onFinish)
// - 不硬切,有 fade out 过渡更柔和(xin 拍板)
//
// 视频源: assets/animations/launch.mp4
//   - 3 秒(avconvert 截 video_1.mov 前 3s)
//   - Preset960x540,~1.1 MB
//
// 注意:不影响 onboarding / home 导航 — _layout.tsx 顶级覆盖,
// fade 完成后 unmount,下面 Stack/Tabs 正常工作。

import { useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { Video, ResizeMode, type AVPlaybackStatus } from "expo-av";

const LAUNCH_VIDEO = require("../../../assets/animations/launch.mp4");

// 淡出时长(ms),xin 拍板 300-500ms 区间,选中位
const FADE_OUT_MS = 400;

type Props = {
  onFinish: () => void;
};

export default function LaunchAnimation({ onFinish }: Props) {
  // 防止 video didJustFinish 跟 onPress 同时 fire 触发双 fade
  const fadeStartedRef = useRef(false);
  // useRef + Animated.Value:同一实例稳定不重建
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const startFadeOut = () => {
    if (fadeStartedRef.current) return;
    fadeStartedRef.current = true;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      startFadeOut();
    }
  };

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim, backgroundColor: "#000000" }]}
      pointerEvents="auto"
    >
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={startFadeOut}
        accessibilityLabel="跳过启动动画"
      >
        <Video
          source={LAUNCH_VIDEO}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          isMuted={false}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />
      </Pressable>
    </Animated.View>
  );
}

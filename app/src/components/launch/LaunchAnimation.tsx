// 启动动画 (v1.2.3 改动 #4) — 每次冷启动播 ~3s 标志性 splash 视频。
//
// 实现:
// - expo-av <Video /> 全屏覆盖
// - 视频结束 (didJustFinish) → 调 onFinish 让父组件 unmount 这个组件
// - 用户点击屏幕也可跳过(降低初次新鲜感后等待感)
//
// 视频源: assets/animations/launch.mp4
//   - 3 秒(avconvert 截 video_1.mov 前 3s)
//   - Preset960x540,~1.1 MB
//   - 包含 mealmate brand 动效
//
// 注意:不影响 onboarding / home 导航 — 这层是 _layout.tsx 顶级覆盖,
// 视频结束后 unmount,下面 Stack/Tabs 正常工作。

import { useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Video, ResizeMode, type AVPlaybackStatus } from "expo-av";

const LAUNCH_VIDEO = require("../../../assets/animations/launch.mp4");

type Props = {
  onFinish: () => void;
};

export default function LaunchAnimation({ onFinish }: Props) {
  const finishedRef = useRef(false);

  const finishOnce = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      finishOnce();
    }
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="auto">
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={finishOnce}
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
    </View>
  );
}

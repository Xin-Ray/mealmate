// Stage 0 结束过渡屏 (v1.2.1)
// 触发: photo.tsx 拍照通过 → advanceFromStage0() 推 {stage:0, kind:"end"}

import { useRouter } from "expo-router";
import SimpleTransitionScreen from "@src/components/stage/SimpleTransitionScreen";

export default function Stage0EndRoute() {
  const router = useRouter();
  return (
    <SimpleTransitionScreen
      badge="试一下 · 完成"
      title="太棒了！"
      subtitle="这就开始了"
      ctaLabel="继续"
      onContinue={() => router.replace("/(main)/home" as never)}
    />
  );
}

// Stage 0.5 完成过渡屏 (v1.2.1)
// 触发: incrementStage05Score 达到 40 → advanceFromStage05() 推
// {stage:0.5, kind:"end"} → (main)/_layout consumer 跳此屏 → 之后 stage 1 start

import { useRouter } from "expo-router";
import SimpleTransitionScreen from "@src/components/stage/SimpleTransitionScreen";

export default function Stage0_5EndRoute() {
  const router = useRouter();
  return (
    <SimpleTransitionScreen
      badge="起步 · 完成"
      title="我们做到了 🎉"
      subtitle="从今天起，我们一起按时吃饭"
      ctaLabel="继续"
      onContinue={() => router.replace("/(main)/home" as never)}
    />
  );
}

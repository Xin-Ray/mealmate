// Stage 0 开始过渡屏 (v1.2.1)
// 触发: 新装用户 onboarding 完,initialState transitionsPending 推一条
// {stage:0, kind:"start"} → (main)/_layout consumer 跳此屏

import { useRouter } from "expo-router";
import SimpleTransitionScreen from "@src/components/stage/SimpleTransitionScreen";

export default function Stage0StartRoute() {
  const router = useRouter();
  return (
    <SimpleTransitionScreen
      badge="试一下"
      title="这里慢慢来"
      subtitle="先拍一张餐照试试"
      ctaLabel="开始"
      onContinue={() => router.replace("/(main)/home" as never)}
    />
  );
}

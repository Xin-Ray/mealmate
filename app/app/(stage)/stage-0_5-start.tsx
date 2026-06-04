// Stage 0.5 开始过渡屏 (v1.2.1)
// 触发: advanceFromStage0() 推 {stage:0.5, kind:"start"} (跟在 stage 0 end 后面)
//
// 注意路由文件名用 `stage-0_5-start.tsx`(下划线代替小数点),expo-router 不允许
// 文件名含 "."。(main)/_layout consumer 用 stageSegment(0.5) → "0_5" 拼路径。

import { useRouter } from "expo-router";
import SimpleTransitionScreen from "@src/components/stage/SimpleTransitionScreen";

export default function Stage0_5StartRoute() {
  const router = useRouter();
  return (
    <SimpleTransitionScreen
      badge="起步"
      title="下一步"
      subtitle="集齐 4 颗爱心 ❤️，我们就正式开始"
      ctaLabel="开始"
      onContinue={() => router.replace("/(main)/home" as never)}
    />
  );
}

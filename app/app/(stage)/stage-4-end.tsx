// 阶段 4 完成过渡屏路由（card presentation + slide_from_right）
// 触发：advanceStage / __internal_runStage5Check 推 transitionsPending
// v1.1 cascade（#11b）：advance 到 stage 5 → 跳 stage-5-start 介绍 60 天 +
//   星数机制。用户在 stage-5-start 点"开始阶段 5" → 回 home。
import { useRouter } from "expo-router";
import StageEndScreen from "@src/components/stage/StageEndScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";

export default function Stage4EndRoute() {
  const router = useRouter();
  return (
    <StageEndScreen
      theme={STAGE_TRANSITIONS[4].end}
      onContinue={() => router.replace("/(stage)/stage-5-start" as never)}
    />
  );
}

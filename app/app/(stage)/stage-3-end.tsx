// 阶段 3 完成过渡屏路由（card presentation + slide_from_right）
// 触发：advanceStage 推 transitionsPending → (main)/_layout consumer 弹此屏
// v1.1 cascade（#11b）：advance 到 stage 4 → 跳 stage-4-start 介绍新机制
//   （体质数据 + 目标体重）。用户在 stage-4-start 点"开始阶段 4" → 回 home。
import { useRouter } from "expo-router";
import StageEndScreen from "@src/components/stage/StageEndScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";

export default function Stage3EndRoute() {
  const router = useRouter();
  return (
    <StageEndScreen
      theme={STAGE_TRANSITIONS[3].end}
      onContinue={() => router.replace("/(stage)/stage-4-start" as never)}
    />
  );
}

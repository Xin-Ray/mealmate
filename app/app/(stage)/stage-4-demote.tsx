// 阶段 4 降级过渡屏路由（card presentation + slide_from_right）
// 触发：HP<0 时由 store demoteStage 推 transitionsPending → (main)/_layout consumer 弹此屏
// CTA → router.replace('/(main)/home')（v0.5 bug1 fix）
import { useRouter } from "expo-router";
import StageDemoteScreen from "@src/components/stage/StageDemoteScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";

export default function Stage4DemoteRoute() {
  const router = useRouter();
  return (
    <StageDemoteScreen
      theme={STAGE_TRANSITIONS[4].demote}
      onContinue={() => router.replace("/(main)/home" as never)}
    />
  );
}

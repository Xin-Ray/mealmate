// 阶段 2 降级过渡屏路由（fullScreenModal）
// 触发：HP<0 时由 store demoteStage 推到 transitionsPending，(main)/_layout consumer 弹此屏
import { useRouter } from "expo-router";
import StageDemoteScreen from "@src/components/stage/StageDemoteScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";

export default function Stage2DemoteRoute() {
  const router = useRouter();
  return (
    <StageDemoteScreen
      theme={STAGE_TRANSITIONS[2].demote}
      onContinue={() => router.dismiss()}
    />
  );
}

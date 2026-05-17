// 阶段 2 完成过渡屏路由（fullScreenModal）
import { useRouter } from "expo-router";
import StageEndScreen from "@src/components/stage/StageEndScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";
import { useStore } from "@src/store/useStore";

export default function Stage2EndRoute() {
  const router = useRouter();
  const markTransitionSeen = useStore((s) => s.markTransitionSeen);
  return (
    <StageEndScreen
      theme={STAGE_TRANSITIONS[2].end}
      onContinue={() => {
        markTransitionSeen(2, "end");
        router.dismiss();
      }}
    />
  );
}

// 阶段 4 完成过渡屏路由（fullScreenModal）
import { useRouter } from "expo-router";
import StageEndScreen from "@src/components/stage/StageEndScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";
import { useStore } from "@src/store/useStore";

export default function Stage4EndRoute() {
  const router = useRouter();
  const markTransitionSeen = useStore((s) => s.markTransitionSeen);
  return (
    <StageEndScreen
      theme={STAGE_TRANSITIONS[4].end}
      onContinue={() => {
        markTransitionSeen(4, "end");
        router.dismiss();
      }}
    />
  );
}

// 阶段 5 完成过渡屏路由（fullScreenModal）
import { useRouter } from "expo-router";
import StageEndScreen from "@src/components/stage/StageEndScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";
import { useStore } from "@src/store/useStore";

export default function Stage5EndRoute() {
  const router = useRouter();
  const markTransitionSeen = useStore((s) => s.markTransitionSeen);
  return (
    <StageEndScreen
      theme={STAGE_TRANSITIONS[5].end}
      onContinue={() => {
        markTransitionSeen(5, "end");
        router.dismiss();
      }}
    />
  );
}

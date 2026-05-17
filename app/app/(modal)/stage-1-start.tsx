// 阶段 1 开始过渡屏路由（fullScreenModal）
import { useRouter } from "expo-router";
import StageStartScreen from "@src/components/stage/StageStartScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";
import { useStore } from "@src/store/useStore";

export default function Stage1StartRoute() {
  const router = useRouter();
  const markTransitionSeen = useStore((s) => s.markTransitionSeen);
  return (
    <StageStartScreen
      theme={STAGE_TRANSITIONS[1].start}
      onStart={() => {
        markTransitionSeen(1, "start");
        router.dismiss();
      }}
    />
  );
}

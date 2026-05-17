// 阶段 5 开始过渡屏路由（fullScreenModal）
import { useRouter } from "expo-router";
import StageStartScreen from "@src/components/stage/StageStartScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";
import { useStore } from "@src/store/useStore";

export default function Stage5StartRoute() {
  const router = useRouter();
  const markTransitionSeen = useStore((s) => s.markTransitionSeen);
  return (
    <StageStartScreen
      theme={STAGE_TRANSITIONS[5].start}
      onStart={() => {
        markTransitionSeen(5, "start");
        router.dismiss();
      }}
    />
  );
}

// 阶段 4 开始过渡屏路由（fullScreenModal）
import { useRouter } from "expo-router";
import StageStartScreen from "@src/components/stage/StageStartScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";
import { useStore } from "@src/store/useStore";

export default function Stage4StartRoute() {
  const router = useRouter();
  const markTransitionSeen = useStore((s) => s.markTransitionSeen);
  return (
    <StageStartScreen
      theme={STAGE_TRANSITIONS[4].start}
      onStart={() => {
        markTransitionSeen(4, "start");
        router.dismiss();
      }}
    />
  );
}

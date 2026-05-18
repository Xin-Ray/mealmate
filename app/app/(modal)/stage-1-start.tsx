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
      // stage 1 是唯一保留 start config 的阶段（其它阶段已删 start）
      theme={STAGE_TRANSITIONS[1].start!}
      onStart={() => {
        markTransitionSeen(1, "start");
        router.dismiss();
      }}
    />
  );
}

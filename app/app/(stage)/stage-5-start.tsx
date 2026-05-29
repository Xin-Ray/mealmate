// 阶段 5 开始过渡屏（v1.1）。
// 与 stage-4-start 同模式：触发未接入，仅 dev 跳。
// stage 5 完成态由 __internal_runStage5Check 触发 push pending stage-5-end。
import { useRouter } from "expo-router";
import StageStartScreen from "@src/components/stage/StageStartScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";

export default function Stage5StartRoute() {
  const router = useRouter();
  return (
    <StageStartScreen
      theme={STAGE_TRANSITIONS[5].start!}
      onStart={() => router.replace("/(main)/home" as never)}
    />
  );
}

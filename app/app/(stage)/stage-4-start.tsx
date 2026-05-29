// 阶段 4 开始过渡屏（v1.1）。
// v0.5 时 stage 2-5 的 start 屏被删（参考 stageTransitions.ts 注释）；v1.1 因为
// stage 4 引入体质数据 + 目标体重，新加回 stage-4-start。
//
// 触发未接入：目前只能从 dev 面板手动跳。advance 到 stage 4 时还是只 push end。
// 未来想 auto-push 需改 advanceStage（暂留 TODO）。
import { useRouter } from "expo-router";
import StageStartScreen from "@src/components/stage/StageStartScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";

export default function Stage4StartRoute() {
  const router = useRouter();
  return (
    <StageStartScreen
      theme={STAGE_TRANSITIONS[4].start!}
      onStart={() => router.replace("/(main)/home" as never)}
    />
  );
}

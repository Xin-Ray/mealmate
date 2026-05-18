// 阶段 2 完成过渡屏路由（card presentation + slide_from_right）
// 触发：advanceStage 推 transitionsPending → (main)/_layout consumer 弹此屏
// CTA "完成" → router.replace('/(main)/home')：清 modal stack + 强跳 home tab
//   （v0.5 bug1 fix：之前用 dismiss() 只关 modal，dev 触发时停留在 settings tab 看不到 home）
import { useRouter } from "expo-router";
import StageEndScreen from "@src/components/stage/StageEndScreen";
import { STAGE_TRANSITIONS } from "@src/data/stageTransitions";

export default function Stage2EndRoute() {
  const router = useRouter();
  return (
    <StageEndScreen
      theme={STAGE_TRANSITIONS[2].end}
      onContinue={() => router.replace("/(main)/home" as never)}
    />
  );
}

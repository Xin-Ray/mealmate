import { useStore } from "@src/store/useStore";
import HomeStage1 from "@src/components/home/HomeStage1";
import HomeStage2 from "@src/components/home/HomeStage2";

// home.tsx 简化为分发器（v0.4 §11.K 第 3 项）
// stage 1 主页待 §11.K 第 4 项 token 化重做。
export default function HomeScreen() {
  const currentStage = useStore((s) => s.currentStage);
  return currentStage === 2 ? <HomeStage2 /> : <HomeStage1 />;
}

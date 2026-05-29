import { useStore } from "@src/store/useStore";
import HomeStage1 from "@src/components/home/HomeStage1";
import HomeStage2 from "@src/components/home/HomeStage2";
import HomeStage3 from "@src/components/home/HomeStage3";
import HomeStage4 from "@src/components/home/HomeStage4";
import HomeStage5 from "@src/components/home/HomeStage5";

// v1.1：home 路由完整 switch（之前只支持 stage 1/2，stage 3-5 fallback 到 1 是 bug）
// 5 个 stage 各自独立组件，详 docs/v1.1-feat-stage345-stats-celebration.md §四
export default function HomeScreen() {
  const currentStage = useStore((s) => s.currentStage);
  switch (currentStage) {
    case 1:
      return <HomeStage1 />;
    case 2:
      return <HomeStage2 />;
    case 3:
      return <HomeStage3 />;
    case 4:
      return <HomeStage4 />;
    case 5:
      return <HomeStage5 />;
    default:
      return <HomeStage1 />;
  }
}

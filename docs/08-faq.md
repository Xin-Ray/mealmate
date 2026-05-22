# FAQ 常见问题

新人 / 内测员 / 自己几个月后回来 看这页可以快速答常见问题。

## 开发环境

### Q: 怎么本地跑 app？

```bash
cd app
pnpm install
pnpm start
```

终端按 `i` 跑 iOS 模拟器，`a` 跑 Android。需要先装 Xcode + iOS Simulator（mac）或 Android Studio。

### Q: 跑起来 YOLO 识别报错 / 没 chips？

YOLO 后端默认 `http://192.168.1.157:8000`（xin 本地）。开发时：
- 跑 xin 自己的后端：本机 IP 跟 xin 不一样 → 配 `EXPO_PUBLIC_DETECT_API_BASE` 到自己本地或公网地址
- 不跑：fail-soft，HP +5 + dialogue 都正常，只是 result 屏没 chips（"识别服务没连上"）

### Q: 体重 OCR 没工作？

需要 `EXPO_PUBLIC_GEMINI_KEY`：
1. 去 https://aistudio.google.com 申请 Gemini API key
2. `.env.local` 加 `EXPO_PUBLIC_GEMINI_KEY=AIza...`
3. 重启 dev server

未配也能跑 —— OCR 静默 fallback 到手填。

### Q: 推送通知没响？

iOS 模拟器**不支持本地通知** —— 必须真机测。推送权限请求第一次进 app 时弹。

## 业务逻辑

### Q: HP 怎么算的？

详 [ADR-0003](./07-adr/0003-hp-0-100-four-band.md)：
- 餐打卡 +5、错过 -10（gentle -5）、加餐 +10、体重 +0.5
- 满 100 → advanceStage；< 0 → demoteStage

### Q: 阶段几个？

5 个：1 坚持 / 2 量化 / 3 健康增重 / 4 营养 / 5 持之以恒。详 [PRD §四](./PRD.md)。

### Q: stage 2 → 3 怎么进阶？

**当前业务逻辑未接**。advanceStage action 支持到 stage 5，但 markMealDone 不会让 stage 2 自动进 3（PRD 决策中）。详 [02-business-flows/stage-transition.md](./02-business-flows/stage-transition.md) "注意事项"。

### Q: gentle mode 怎么用？

settings → 切开关。打开后未来 missed 扣分 -10 → -5。**不追溯过去**。

### Q: 加餐为什么有上限？

防作弊通关（一直拍点心 HP +10 升级太快）。每日 2 次封顶。详 [02-business-flows/snack.md](./02-business-flows/snack.md)。snack feature 在 `feat/issue-3-snack-card` 分支，main 还没合。

### Q: 错过餐 modal 太烦？

v0.4 起 modal 已经是次入口，主要交互走 home 上的 MealIncompleteCard。modal 只在**首个**新 missed 时弹一次，后续 home 卡 cycle 显示。

## 故障

### Q: app 启动崩溃，可能是？

最可能：persist hydrate 失败（schema migrate 错）。临时解：
- iOS: 设置 → 通用 → iPhone 储存空间 → mealmate → 删除 → 重装
- 长期：migrate 函数加 try/catch + fallback default（v1.0 计划）

### Q: 我升级后数据丢了？

mealmate **完全本地**，重装会丢。iCloud 备份恢复可能带回 AsyncStorage（取决于备份策略）。v1.1+ 加 Apple Sign In 云同步。详 [ADR-0002](./07-adr/0002-client-only-no-backend.md)。

### Q: stage-1-end 屏点了"完成"没动？

之前的 bug，已 fix（router.replace 跳 (main)/home）。如果还出现，看 (main)/_layout useEffect 是否正确消费 transitionsPending。

### Q: home WeightCard 不显示？

只 stage 2+ 才显示。Stage 1 用户故意隐藏（PRD：先稳定吃 3 餐再开始关注体重）。

## 部署

### Q: 怎么 EAS Build？

```bash
cd app
eas build --profile production --platform ios
```

详 [06-deploy/release.md](./06-deploy/release.md)。

### Q: TestFlight 怎么内测？

EAS submit 后在 App Store Connect → TestFlight → 加测试组 + 邀 email。详 release.md。

### Q: 上架 App Store 卡审核了？

看拒绝邮件。常见拒因：
- 无隐私政策 URL → 必须有 https 静态页（GitHub Pages 简单做一个）
- demo 账户缺失 → mealmate 无登录，写明
- 健康类描述 → 别说"医疗"，说"陪伴 / 提醒"

## 设计

### Q: 颜色 / 字号哪里定的？

`docs/design-system.md` + `app/src/theme/tokens.ts`（设计令牌 source of truth）。NativeWind class 应用这些 token。

### Q: 文案规范？

[PRD §八](./PRD.md)：温柔正向，禁"奖励 / 失败 / 必须 / 应该"等强词。详 PRD。

### Q: mascot 头像哪里换？

`app/assets/mascot/`（多个 stage / mood 变体）+ `<Mascot>` 组件。v0.5 用了新角色（[commit f94c7f9](#)）。

## 安全 / 隐私

### Q: Gemini key 安全吗？

**v0.5 不安全**：客户端 bundle 暴露。v1.0 上架前必须迁 Cloudflare Worker。详 [ADR-0005](./07-adr/0005-llm-key-client-exposure.md)。

### Q: 用户数据云端有吗？

**无**。完全本地 AsyncStorage。详 [ADR-0002](./07-adr/0002-client-only-no-backend.md)。

### Q: 进食障碍 / 敏感用户怎么照顾？

PRD §11.L 安全条款：
- gentle mode（settings 切，扣分减半）
- stage 1 demote 走 support 调（建议联系医生 / 营养师），不是惩罚
- 文案严守 PRD §八（无强词）
- 加餐 / 错过都不评判，只记录

## 文档结构

### Q: 老的 docs/product/ docs/design/ 还有吗？

保留 + 加了 deprecation 提示，指到新结构。新文档全在编号目录下（00-08）。

### Q: 我要新加一份模块文档放哪？

`docs/03-modules/<module>.md`，按 [03-modules/](./03-modules/) 现有模板。然后在 `00-readme.md` 文档地图 + 相关业务流程 doc 加链接。

### Q: PRD / dev-log 还更新吗？

更新：
- **PRD** 仍是产品需求 source of truth，业务流程变更同步
- **dev-log** 仍是开发日志（不每天写，每个 milestone 总结）

不更新：
- 旧 docs/{product,design,api,architecture,dev,deploy} —— 新内容入 00-08 编号结构

---

没找到答案？翻 [00-readme.md](./00-readme.md) 文档地图，或问 xin。

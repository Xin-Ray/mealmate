# 发布流程

mealmate 通过 EAS Build → TestFlight → App Store。下面是从 commit 到上架的完整步骤。

## 流程图

```mermaid
flowchart LR
  Dev[本地开发] --> Commit[git commit]
  Commit --> Push[push 到分支]
  Push --> Merge[merge 到 main]
  Merge --> Bump[bump version<br/>app.json + eas.json]
  Bump --> EAS[eas build<br/>--profile production]
  EAS --> Wait[EAS 云构建<br/>~10-20min]
  Wait --> Submit[eas submit<br/>--platform ios]
  Submit --> ASC[App Store Connect<br/>处理中 ~30min]
  ASC --> TestFlight[TestFlight 可下载]
  TestFlight --> Review[填 What to Test<br/>提交审核]
  Review --> ProdReview[App Review<br/>1-3 天]
  ProdReview --> Live[App Store 上架]
```

## 版本号约定

`app/app.json`：
- `version`：marketing version，`x.y.z`（PRD 跟踪用）
- `ios.buildNumber`：自增 int，EAS `autoIncrement: 'buildNumber'` 维护

例如 v0.5：
- version: "0.5.0"
- buildNumber: 8（EAS 每次 build production +1）

## 步骤明细

### 1. 准备发布

- main 干净（无 WIP）
- 所有 v0.X 计划 issue closed
- README architecture overview 更新（如果架构有变）
- dev-log 更新版本节
- 把 PRD §最新版本号同步到 PRD doc 头

### 2. Bump version

编辑 `app/app.json`：
```json
{
  "expo": {
    "version": "0.5.0"
  }
}
```

提交：
```
git commit -m "chore: bump to v0.5.0"
```

### 3. EAS Build

```bash
cd app
eas build --profile production --platform ios
```

- EAS 云构建 ~10-20min
- 完成后在 dashboard 看到 .ipa（下载或直接 submit）

### 4. EAS Submit

```bash
eas submit --profile production --platform ios --latest
```

- 上传到 App Store Connect
- ASC 处理 ~30min
- 处理完邮件通知

### 5. TestFlight 内测

- 在 ASC 把 build 加到 TestFlight 测试组
- 填写"测什么"（What to Test）
- 邀请测试员（用 email）
- 测试员收邮件后通过 TestFlight app 安装

### 6. 提交 App Review

- ASC → My Apps → mealmate → 选 build → 填写发布信息：
  - 截图（iPhone 6.5", 5.5"）
  - 描述（中英文）
  - 关键词
  - 隐私政策 URL
- 提交审核
- 等 1-3 天

### 7. 上架

- 审核通过后选"手动放出"或"自动放出"
- 自动 → 立刻 live
- 手动 → 自己在 ASC 点 release

## v0.5 release checklist（Plan B）

- [x] Stage 1 hotfix 已 fix
- [x] Issue #1 NextMealCard skip done
- [x] Issue #3 SnackCard 加餐
- [x] design-system 设计令牌入库
- [x] business-model 文档入库
- [ ] docs 重构（**本次任务**）
- [ ] bump v0.5.0
- [ ] EAS build production
- [ ] TestFlight 内测 1 周
- [ ] 收集 feedback → 修 bug → patch v0.5.1
- [ ] 提 App Review

## CI / Github

- 当前**没接 CI**（手动 build）
- v1.0 计划接 EAS GitHub integration：merge main → 自动 build TestFlight
- 现状脚本：`pnpm typecheck` + `pnpm lint`（无 CI runner，靠开发者自觉跑）

## 常见问题

| 问题 | 处理 |
|---|---|
| EAS build 卡 in queue | 免费层有限制，等或升级 |
| ipa 太大（>200MB） | 检查 fonts / assets，用 expo-image 而非 require png |
| App Review 拒（隐私政策） | 必须有 https URL 的隐私政策页，自建静态页或用 GitHub Pages |
| App Review 拒（功能问题） | 看拒绝邮件附 screenshot，对症 fix → resubmit |
| 推送权限请求被拒（用户层） | 不影响审核；app 内提示用户去设置开 |

详细 rollback 见 [rollback.md](./rollback.md)。

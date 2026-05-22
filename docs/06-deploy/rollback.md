# 回滚 / 故障恢复

mealmate 是 client app，发版后用户已经装到机器上，"回滚"和后端 deploy 不一样：你不能让上周的 build 自动退回。下面分三种场景。

## 场景 1：发现严重 bug，未提审

最简单：

1. 修 bug → commit → bump patch version（0.5.1）
2. 重新 `eas build --profile production --platform ios`
3. submit + 替换 TestFlight 当前 build
4. 通知内测员重装

**预计时间**：30-60min

## 场景 2：已上架 App Store，发现严重 bug

App Store 有"Expedited Review"加急审核（每年限 2 次）。

1. 修 bug → commit → bump patch version
2. EAS build production
3. ASC submit → **Request Expedited Review**（在 Resolution Center 提交理由：crash / data loss / 安全问题）
4. Apple 通常 24h 内审
5. 上架后用户自动更新

**预计时间**：24-72h

期间措施：
- 用户群 / 公告说"已知问题，正在修复"
- 如有 Sentry / Crashlytics（v1.1+），监控影响面
- **不要在 App Store description 里删该 build** —— 反而让用户没法装

## 场景 3：服务端 API 挂

mealmate 依赖：
- Gemini API（Google）—— 一般不会挂，挂了 fallback 本地池
- YOLO 自建后端 —— xin 个人维护

如果 YOLO 后端挂：
1. **客户端已 fail-soft**：12s timeout + catch → 用户照常打卡，只是没识别 chips
2. **不需要紧急发版**
3. 修后端：重启服务 / 排查日志
4. 监控（[GitHub Issues](#) 或 group 反馈）

如果 Gemini API key 被滥用 / 额度跑光：
1. **临时**：在 Google AI Studio 关掉 key（停止流出）→ 客户端 fallback 本地池
2. **永久**：在 ADR-0005 加速 v1.1 Worker 迁移

## 场景 4：用户数据丢失 / 错乱

mealmate 数据在本地 AsyncStorage（无云端），所以：
- 用户重装 app → 数据丢失（已在 PRD §10 提示）
- 用户 iCloud 备份恢复 → AsyncStorage 跟随恢复
- migrate 函数挂导致 hydrate 失败 → 当前 fallback 是 throw，**用户看到崩溃**

**预防**：
- migrate 函数加 try/catch + fallback default state（v1.0 待加）
- 关键字段加范围校验（hp clamp / stage clamp）—— 已实现
- v1.1 加云同步后双备份

## 通用 checklist

发现严重 bug 时：
- [ ] 复现并定位（issue + 截图）
- [ ] 决定严重度（crash / data loss / 影响核心流程 → P0；体验问题 → P1）
- [ ] P0 → 立刻 hotfix + 加急审核
- [ ] P1 → 下个版本一起修
- [ ] 通知内测群 / 用户群
- [ ] 修后写 postmortem 进 dev-log

## App Store 撤架（终极）

如果发现 v1.0 有不可挽回问题：

- ASC → My Apps → mealmate → 选版本 → **Remove from Sale**
- 用户已下载的 app 还能用，但 App Store 搜不到
- 之后修好再 Resubmit

**很少用到**，但作为安全网知道有。

## v0.5+ 监控（计划）

- Sentry（crash + error tracking）—— v1.0 接入
- Mixpanel / PostHog（事件埋点）—— v1.1 看用户路径
- 自建 metric 上报 → Cloudflare Worker—— v1.1+

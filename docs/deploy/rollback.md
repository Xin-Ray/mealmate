# Rollback — stub

## 当前 v0.4

无后端可回滚。客户端版本回滚靠：

- **App Store 撤回 build**：在 App Store Connect 把上一版重新提交（不是"回滚"是"再发"）。
- **OTA hotfix**：如果 bug 是 JS 层 → `eas update --branch production --message "..."` 推回旧的 JS bundle。
- **强制升级**：客户端启动时 ping `/v1/min-version`（v0.5+ 后端），低于阈值 → 弹"请升级"banner。

## v0.5+ 预案

### 1. 后端代码回滚

- Worker：CF dashboard "Versions" 一键回滚到上一版本（无停机）。
- DB schema：每个 migration 必须配 `down.sql`，回滚跑 `down`。

### 2. 数据修复

- 写入 bug 导致脏数据 → 手写脚本批量修，**绝不直接 SQL UPDATE 生产**。
- 提前 backup（CF D1 自带 PITR）。

### 3. 通讯

- 影响超过 N% 用户的事故 → 客户端 banner + email 通知。
- 隐私 / 数据安全事故 → 7 天内披露（GDPR-style）。

## 演练

v1.0 前至少做一次 staging 全链路回滚演练：

1. 故意往 staging 推一个坏 Worker 版本
2. 验证 dashboard 一键回滚 < 60s
3. 验证客户端自动恢复 / 兜底文案池不崩

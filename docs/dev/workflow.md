# Workflow

## 当前协作模式（v0.4，单人开发期）

xin 给 task，task 在 feature branch 上实施，验完 commit，**不 push 等 xin review** 后由 xin 决定 push / merge。

## Feature branch 流程

```
git checkout main && git pull
git checkout -b <type>/<scope>
# 写代码 → 改测 → tsc 通过
# 视觉相关改动：simulator 截图 + Read 工具自查 + 对照 Figma frame
git add -A
git commit -m "<type>(<scope>): <简短中文描述>"
# 不 push
# 向 xin 汇报：commit hash + 改了什么 + 怎么测
```

### branch 命名

| prefix | 用途 | 示例 |
|---|---|---|
| `feature/` | 新功能 | `feature/stage-transitions` |
| `fix/` | bug 修复 | `fix/keyboard-blocks-cta` |
| `docs/` | 文档 | `docs/structure-reorg` |
| `chore/` | 杂项（依赖升级 / 重构 / 删孤儿）| `chore/v0.4-cleanup` |
| `hotfix/` | 紧急修 | `hotfix/v0.4-13-hp-init` |

## Commit message

### 格式

```
<type>(<scope>): <一句话中文描述>

[可选 body：更详细的为什么 + 怎么做]

[可选 footer：BREAKING CHANGE / Closes #issue]
```

### type 枚举

| type | 用途 |
|---|---|
| `feat` | 新功能 |
| `fix` | bug 修复 |
| `docs` | 文档 |
| `style` | 代码风格 / 视觉调整（不影响行为）|
| `refactor` | 重构 |
| `chore` | 杂项（依赖 / 清理）|
| `test` | 测试 |

### scope 例子

- `home` / `records` / `stats` / `settings`
- `store` / `hp` / `migrate`
- `weight-entry` / `photo` / `meal-missed`
- `tabs` / `modal`
- `stage1` / `stage2`

### 示例

```
feat(stage1): 对齐 Stage 2 hero 骨架 + 初始 HP 60 / Stage 2 50（migrate v6）
fix(stats): X 轴改记录时间 + 去掉空数据虚线圈
docs: 添加如何运行 app 章节到 README
chore: v0.4 收尾 — 删 stage2 屏 + 孤儿组件 + photo 抽 (modal) group
```

## Push 规则

- **feature branch 可以 push**（开 PR review 时需要）—— 当前阶段 xin 还没启用 PR，所以 push 等 xin 决定。
- **main 直接 push 禁止**：永远走 feature branch + PR / 手动 merge。
- **不 force push** 任何已 push 过的分支，除非 xin 明确说可以。

## PR review（v0.5+ 多人协作启用）

- 1 reviewer minimum
- PR 描述模板：summary / what changed / how to test / screenshots
- 必须 tsc 通过 + 关键路径 simulator/device 截图

## tsc / lint

- 任何提交前必须 `npx tsc --noEmit` 0 错。
- ESLint 配置在 `app/eslint.config.js`，rule 集尚未严格化（v0.5+ 加 strict）。

## 视觉验证

视觉改动的标准三件事：

1. simulator boot + 截图（`xcrun simctl io booted screenshot /tmp/xxx.png`）
2. Read 工具自查截图
3. 对照 Figma frame（node-id 写进 commit message 或代码注释）

device build 上验证可选（视觉差异主要 simulator 已能看出）。

## 留账

每个 task 完成后：

- 不重要的 → 直接 commit message 写清楚
- 涉及决策 / 留下的 TODO → 进 `docs/dev/dev-log.md` 一条
- 影响架构 → 写 ADR（`docs/architecture/decisions/`）

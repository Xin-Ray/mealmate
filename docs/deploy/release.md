# Release

## v1.0 现状

main HEAD `87b0f21`，`app/app.json` `version: 1.0.0` + `ios.buildNumber: 1`，`app/eas.json` 配好 3 profile。

**还没真的 `eas build`** —— 需要 xin 亲自做一些一次性步骤（Apple credentials、App Store Connect 建 app record）。下面是详细清单。

---

## 一次性准备（xin 亲自做）

### 1. 注册 Apple Developer Program

- 链接：[developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/)
- 费用：**$99 / 年**
- 注册需要：Apple ID + 实名 + 信用卡
- 等待审核：通常 24–48 小时

完成后，xin 的 Apple ID 才能创建 App Store Connect 记录、配 provisioning profile、上传 build。

### 2. 在 App Store Connect 建 app record

- 链接：[appstoreconnect.apple.com](https://appstoreconnect.apple.com/)
- 我的 App → "+" → 新 App
- 配置：
  - **平台**：iOS
  - **名称**：MealMate（这是 App Store 显示名，可以加副标题，但 30 字以内）
  - **主要语言**：简体中文
  - **Bundle ID**：`com.xinray.mealmate`（要先到 [developer.apple.com](https://developer.apple.com/account/resources/identifiers/list) 注册 identifier，再回来选）
  - **SKU**：随便填一个唯一字符串，比如 `mealmate-ios-2026`
- 创建后会拿到 **`ascAppId`**（数字串）→ 填进 `app/eas.json` 替换 `TODO_FROM_APP_STORE_CONNECT`

### 3. 安装 EAS CLI

```bash
npm install -g eas-cli
eas --version  # 验证装好
```

### 4. `eas login` —— 用 Apple ID 登录

```bash
cd app
eas login
# CLI 会问 Expo 账号（如果没有先注册 expo.dev）
```

Apple credentials 第一次 `eas build` 时单独问。

---

## 发 build 流程

### preview build（TestFlight internal，先内部测）

```bash
cd app
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx tsc --noEmit   # 必须 0 错
eas build --platform ios --profile preview
```

- 首次会问 Apple credentials → 用 Apple Developer 账号登录 + 二步验证码
- 自动生成 / 上传 distribution cert 和 provisioning profile
- 云端 build 10–20 分钟
- 输出 IPA + 自动上传 App Store Connect

### production build（正式 App Store 提审）

```bash
cd app
eas build --platform ios --profile production
```

- `production` profile 配了 `autoIncrement: true` → 每次 build 自动 `ios.buildNumber += 1`（避免上传重复 build 被 Apple 拒）
- 同样产 IPA + 自动上传 ASC

### submit（让 Apple 知道这个 build 是哪个 app）

EAS Build 默认完成后会自动 submit；如果分开做：

```bash
eas submit --platform ios --latest
```

---

## TestFlight 测试

build + submit 完成后：

1. App Store Connect → MealMate → TestFlight tab
2. 自动看到刚 upload 的 build（状态走："Processing" → "Ready to Test"）
3. **加内部测试员**（小团队，最多 100 人，不需 Apple 审核）：
   - TestFlight → 内部测试 → "+" 群组 → 加自己的 Apple ID
4. **外部测试**（公开 beta，最多 10,000 人，要走简单 Apple 审核 1–2 天）：
   - 外部测试 → 加邀请人 / 邀请链接

xin iPhone 装 TestFlight app（App Store 搜 TestFlight），用 Apple ID 登录 → install MealMate beta。

---

## App Store 上架

beta 测稳后：

1. ASC → MealMate → App Store tab
2. 提交版本 1.0：
   - 选已上传的 build（最新 production build）
   - 填 "App Privacy"（隐私政策必填，PRD §八）
   - 填 What's New（复制 [`docs/product/changelog.md`](../product/changelog.md) 的 v1.0.0 entry，调整为用户可读）
   - 截图 5 张（iPhone 6.5" / 6.7"）
   - App Store 描述、关键词、年龄分级
3. 提交审核 → Apple 审核 1–7 天
4. 通过 → App Store 上架

---

## CHANGELOG 同步

每发 release：

1. 更新 [`docs/product/changelog.md`](../product/changelog.md)（按 Added / Changed / Fixed 归类）
2. App Store Connect "What's New" 复制 changelog 的"用户可见改动"
3. 客户端 settings 页加"版本号 + 本次更新内容"链接（v1.1+）

## OTA hotfix（紧急 JS 修复，绕过审核）

`expo-updates` 配置后可以直接推 JS bundle 修复（限制：不能改 native 代码）：

```bash
eas update --branch production --message "hotfix: <一句话>"
```

⚠️ 仅用于 P0 bug（崩溃 / 数据丢失类）—— 滥用绕过审核可能违反 Apple 政策。

## Release 节奏（v1.1+ 目标）

- TestFlight internal：每 commit 自动 build（CI 触发 `eas build`，未配）
- TestFlight external：每周 1 个 build，邀请 100 名 beta 用户
- App Store：每 4–6 周 1 个版本

---

## 给 xin 的 next-step 清单（v1.0 上架）

按顺序：

1. ☐ 注册 Apple Developer Program（$99/年）→ 等审核
2. ☐ developer.apple.com 注册 bundle identifier `com.xinray.mealmate`
3. ☐ App Store Connect 创建 MealMate app record → 拿到 ascAppId
4. ☐ 把 ascAppId 填进 `app/eas.json` 替换 `TODO_FROM_APP_STORE_CONNECT`
5. ☐ `npm install -g eas-cli && eas login`
6. ☐ `cd app && eas build --platform ios --profile preview`
7. ☐ 等 build 完成 → 自动到 ASC → 加 TestFlight 内部测试群组
8. ☐ iPhone 装 TestFlight app + install MealMate beta，跑通完整 onboarding + 5 阶段过渡 + photo YOLO + weight OCR
9. ☐ beta 测无大问题 → `eas build --platform ios --profile production` → 提审 App Store
10. ☐ 准备 App Store 上架材料：截图 5 张 / 描述 / 隐私政策 / 用户协议

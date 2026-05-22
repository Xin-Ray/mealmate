# 环境配置

mealmate 是 client-only Expo app，"环境"主要是 dev / TestFlight / Production，差异在 API endpoint + key + 推送 channel。

## 环境列表

| 环境 | bundle id | API base | Gemini key | YOLO base | 用途 |
|---|---|---|---|---|---|
| dev | com.xinxiang.mealmate.dev | 本地 IP | xin dev key | http://192.168.1.157:8000 | 模拟器 / 真机调试 |
| TestFlight | com.xinxiang.mealmate | Gemini 公网 | xin staging key | 远端 YOLO（v0.6 待迁） | 内测 |
| Production | com.xinxiang.mealmate | Gemini 公网 | xin prod key（v1.1 Worker 代理） | 远端 YOLO | 上架 |

## 环境变量

通过 `.env.local` / `.env.production` / `app.config.ts` 注入，**仅 `EXPO_PUBLIC_*` 前缀的变量会注入到客户端 bundle**。

```bash
EXPO_PUBLIC_GEMINI_KEY=AIza...
EXPO_PUBLIC_DETECT_API_BASE=http://192.168.1.157:8000
```

> ⚠️ `EXPO_PUBLIC_*` 前缀的变量**全部进 client bundle**，包括 key。OS 反编译可看，v1.1 必须迁 Worker，详见 [ADR-0005](../07-adr/0005-llm-key-client-exposure.md)。

## 配置文件

- `app/app.config.ts` —— Expo 动态配置（读取 env 注入 extra）
- `app/eas.json` —— EAS Build profiles（development / preview / production）
- `app/package.json` —— 依赖固定版本
- `.env.local`（不入库）—— 本地开发 key
- `.env.production`（不入库）—— 生产 key

## 切换环境

- **dev / Expo Go**：`pnpm start` + 在终端选 i (iOS) / a (Android)
- **dev / Dev Client**：`eas build --profile development` 装到真机后 `pnpm start --dev-client`
- **TestFlight build**：`eas build --profile preview --platform ios`
- **Production build**：`eas build --profile production --platform ios`

## EAS profiles

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "autoIncrement": "buildNumber"
    }
  }
}
```

## 第三方服务账户

| 服务 | 账户 | 用途 |
|---|---|---|
| Apple Developer | xin@... | App Store / TestFlight / 推送证书 |
| EAS（Expo） | xinxiang | Build cloud |
| Google AI Studio | xin@... | Gemini API key |
| 阿里云 / 个人 VPS | xin@... | YOLO 后端托管（待迁） |

## 推送

- 当前用 expo-notifications **本地通知**，无服务器推送，不需要 APNs token 后端（[ADR-0003](../07-adr/0003-minor-tech-choices.md) "本地通知"节）
- v1.1+ 加 cloud sync 后再决定是否启用 APNs

## 域名

- 暂无自有域名
- v1.1+ 申请 `mealmate.app` 或 `mealmate.xyz` 用于 Worker / 落地页

## 关闭推送 / 数据清理

用户手动操作：
- iOS 设置 → 通知 → mealmate → 关闭
- App 内 settings → 全部清空 → 清 AsyncStorage（不可逆）

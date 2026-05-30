// Sign in with Apple 接入。
//
// 流程：
//   1) signInWithApple() 调 expo-apple-authentication 拿 identityToken
//   2) POST /auth/apple { identity_token } -> { user_id, token, email? }
//   3) 调用方把返回的 (user_id, token, email) 存到 store.account
//
// 平台限制：仅 iOS（Apple 不提供 Android native flow）。Android 走另一套登录
// （magic link / 邮箱密码），目前还没接，调用前应先看 isAvailable()。

import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { apiRequest } from "./apiClient";

export type AuthResponse = {
  user_id: string;
  token: string;
  email: string | null;
};

export const isAppleSignInAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== "ios") return false;
  return AppleAuthentication.isAvailableAsync();
};

export async function signInWithApple(): Promise<AuthResponse> {
  if (Platform.OS !== "ios") {
    throw new Error("Sign in with Apple is iOS only");
  }
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    ],
  });
  if (!credential.identityToken) {
    throw new Error("apple credential missing identityToken");
  }
  return apiRequest<AuthResponse>("/auth/apple", {
    method: "POST",
    body: { identity_token: credential.identityToken },
  });
}

export async function logout(token: string): Promise<void> {
  try {
    await apiRequest<{ ok: true }>("/auth/logout", { method: "POST", token });
  } catch {
    // logout 静默：即便服务器请求失败，本地清状态即可
  }
}

export async function deleteAccount(token: string): Promise<void> {
  await apiRequest<{ ok: true }>("/auth/me", { method: "DELETE", token });
}

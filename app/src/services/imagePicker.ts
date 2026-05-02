// 共享的图片选择封装，含 simulator 无相机时弹 Alert 转相册的 fallback。
// 被 photo.tsx（餐次拍照）和 weight-entry.tsx（体重秤拍照）复用。
//
// 返回 null 表示用户取消、权限拒绝、或失败（已弹过 Alert，调用方静默处理即可）

import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

export type Source = "camera" | "library";
export type PickedImage = { uri: string };

export async function pickImageWithFallback(
  source: Source
): Promise<PickedImage | null> {
  // 1. 权限
  const permResp =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permResp.granted) {
    Alert.alert(
      source === "camera" ? "没有相机权限" : "没有相册权限",
      source === "camera"
        ? "可以改用相册选一张。"
        : "去设置里允许一下吧。"
    );
    return null;
  }

  // 2. 启 picker（catch 模拟器无相机等错）
  try {
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (result.canceled) return null;
    return { uri: result.assets[0].uri };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const isUnavailable = /not available|unavailable/i.test(msg);
    if (source === "camera" && isUnavailable) {
      // 模拟器无相机：弹 Alert 转相册（递归调）
      return new Promise((resolve) => {
        Alert.alert(
          "相机不可用",
          "当前设备没有相机（比如模拟器）。要不要从相册选一张？",
          [
            {
              text: "取消",
              style: "cancel",
              onPress: () => resolve(null),
            },
            {
              text: "从相册选",
              onPress: async () => {
                const r = await pickImageWithFallback("library");
                resolve(r);
              },
            },
          ]
        );
      });
    }
    Alert.alert(
      source === "camera" ? "拍照失败" : "选图失败",
      msg
    );
    return null;
  }
}

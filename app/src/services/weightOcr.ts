// 体重秤 OCR — 调 mealmate backend `/ocr/weight`（EasyOCR CRNN, GPU 推理）
//
// 2026-05-30 切换：v1.0.1 前用 Gemini 2.5 Flash Vision 直连 Google API，TestFlight
// 上挂（key 没注入 EAS env + 国内不稳定）。v1.0.2 后端加了 EasyOCR endpoint，
// 这里改成 POST 图片到 backend，由 GPU 跑 OCR 返回 kg 数字。
//
// 设计：
// - 调用方 API 不变（imageUri, signal? → kg | null），不需要改 weight-entry.tsx
// - 返回 null 表示"没识别出来"：服务器返回 kg=null / HTTP 错 / 网络挂 / Abort
// - 用 AbortController 支持取消（用户在识别中切换照片时打断旧请求）

import { getApiBase } from "./apiClient";

const TIMEOUT_MS = 12_000;

const guessMime = (uri: string): string => {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
};

const guessName = (uri: string): string => {
  const slash = uri.lastIndexOf("/");
  if (slash >= 0 && slash < uri.length - 1) return uri.slice(slash + 1);
  return "scale.jpg";
};

type OcrResponse = {
  kg: number | null;
  confidence: number;
  raw_text: string;
  inference_ms: number;
};

export async function recognizeWeightKg(
  imageUri: string,
  signal?: AbortSignal
): Promise<number | null> {
  const url = `${getApiBase()}/ocr/weight`;
  const form = new FormData();
  // RN/Expo 的 FormData 接收 {uri, name, type} 形态
  form.append("image", {
    uri: imageUri,
    name: guessName(imageUri),
    type: guessMime(imageUri),
  } as unknown as Blob);

  // 外部 signal + 自身 timeout 合并：先到任何一个就 abort
  const localCtrl = new AbortController();
  const timer = setTimeout(() => localCtrl.abort(), TIMEOUT_MS);
  const onOuterAbort = () => localCtrl.abort();
  signal?.addEventListener("abort", onOuterAbort);

  try {
    const resp = await fetch(url, {
      method: "POST",
      body: form,
      signal: localCtrl.signal,
      // 不要手动设 Content-Type，让 fetch 自己带 boundary
    });
    if (!resp.ok) {
      if (__DEV__) {
        const body = await resp.text().catch(() => "(no body)");
        console.warn("[weightOcr] HTTP", resp.status, body.slice(0, 300));
      }
      return null;
    }
    const j = (await resp.json()) as OcrResponse;
    if (j.kg == null) return null;
    if (j.kg < 20 || j.kg > 250) {
      if (__DEV__) console.warn("[weightOcr] out of range:", j.kg);
      return null;
    }
    if (__DEV__) {
      console.log(
        `[weightOcr] ok: ${j.kg} (conf=${j.confidence}, ${j.inference_ms}ms)`
      );
    }
    return j.kg;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return null;
    if (__DEV__) console.warn("[weightOcr] fetch error:", String(e));
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onOuterAbort);
  }
}

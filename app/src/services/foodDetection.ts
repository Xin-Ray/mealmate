// 食物识别后端的调用层。
//
// 后端契约见 mealmate (backend) README §5：
//   POST /detect, multipart/form-data, field name = "image"
//   200 -> { detections: [{label, bbox, confidence}], model, inference_ms }
//
// 失败策略：抛错让 caller 决定降级（photo.tsx 选择"识别失败也允许打卡"）。

const DEFAULT_BASE = "http://192.168.1.157:8000";

const baseUrl = (): string => {
  const env = process.env.EXPO_PUBLIC_DETECT_API_BASE;
  return (env && env.trim()) || DEFAULT_BASE;
};

export type Detection = {
  label: string;
  bbox: [number, number, number, number]; // x1, y1, x2, y2
  confidence: number;
};

export type DetectResponse = {
  detections: Detection[];
  model: string;
  inference_ms: number;
};

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
  return "upload.jpg";
};

// 12s 超时：GPU 端推理只要 <100ms，主要花在上传，弱网也够。
const TIMEOUT_MS = 12_000;

export async function detectFood(imageUri: string): Promise<DetectResponse> {
  const url = `${baseUrl()}/detect`;
  const form = new FormData();
  // RN/Expo 的 FormData 接收 {uri, name, type} 形态
  form.append("image", {
    uri: imageUri,
    name: guessName(imageUri),
    type: guessMime(imageUri),
  } as unknown as Blob);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      method: "POST",
      body: form,
      signal: controller.signal,
      // 不要手动设 Content-Type，让 fetch 自己带 boundary
    });
    if (!resp.ok) {
      throw new Error(`detect ${resp.status}: ${await resp.text()}`);
    }
    return (await resp.json()) as DetectResponse;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkHealth(): Promise<{
  status: string;
  device: string;
  model_loaded: boolean;
}> {
  const resp = await fetch(`${baseUrl()}/health`);
  if (!resp.ok) throw new Error(`health ${resp.status}`);
  return resp.json();
}

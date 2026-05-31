// 食物识别后端的调用层。
//
// 后端契约 v1.1.2（Food-101 classifier，HF nateraw/food）：
//   POST /detect, multipart/form-data, field name = "image"
//   200 → {
//     is_food: boolean,
//     food_label: string | null,       // 中文，"美食"/"炒饭"... 或 null（!is_food）
//     confidence: number,
//     top_predictions: [{label, label_en, confidence}],
//     detections: [{label, confidence}],  // v1.0 兼容字段
//     model: string,
//     inference_ms: number
//   }
//
// caller (photo.tsx) 拿 isFood / foodLabel 决定是否打卡 + 显示什么名字。

// 默认走公网 Cloudflare Tunnel（同一台 backend，跟 apiClient 共用域名）。
// dev 跑本地后端时 .env.local 里设 EXPO_PUBLIC_DETECT_API_BASE=http://<LAN-IP>:8000
// 或 EXPO_PUBLIC_API_BASE 覆盖。
const DEFAULT_BASE = "https://api.flykid.xyz";

const baseUrl = (): string => {
  // 优先用统一的 EXPO_PUBLIC_API_BASE，兼容老 .env.local 的 DETECT_API_BASE
  const env =
    process.env.EXPO_PUBLIC_API_BASE ?? process.env.EXPO_PUBLIC_DETECT_API_BASE;
  return (env && env.trim()) || DEFAULT_BASE;
};

export type TopPrediction = {
  label: string;        // 中文
  labelEn: string;      // 英文原始 Food-101 标签
  confidence: number;   // 0-1
};

export type DetectResult = {
  isFood: boolean;
  foodLabel: string | null;   // 中文，"美食"/"炒饭"... 或 null
  confidence: number;          // top-1 confidence
  topPredictions: TopPrediction[];
  model: string;
  inferenceMs: number;
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

// 12s 超时：GPU 端推理只要 <100ms（首次 350MB 模型 lazy load 可能到几秒），
// 主要花在上传。弱网也够。
const TIMEOUT_MS = 12_000;

export async function detectFood(imageUri: string): Promise<DetectResult> {
  const url = `${baseUrl()}/detect`;
  const form = new FormData();
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
    const j = (await resp.json()) as {
      is_food: boolean;
      food_label: string | null;
      confidence: number;
      top_predictions?: Array<{ label: string; label_en: string; confidence: number }>;
      model: string;
      inference_ms: number;
    };
    return {
      isFood: j.is_food,
      foodLabel: j.food_label,
      confidence: j.confidence,
      topPredictions: (j.top_predictions ?? []).map((p) => ({
        label: p.label,
        labelEn: p.label_en,
        confidence: p.confidence,
      })),
      model: j.model,
      inferenceMs: j.inference_ms,
    };
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

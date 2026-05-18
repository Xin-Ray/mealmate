// 体重秤 OCR — Gemini 2.5 Flash Vision 读取秤面数字（kg）
//
// 设计：
// - 复用 mascotLlm.ts 的 EXPO_PUBLIC_GEMINI_KEY（同一个 key，同一份 quota）。
// - 模型用 gemini-2.5-flash（非 lite）：lite 也支持 vision，但 OCR / 细节识别
//   flash 更稳；体重打卡每天 1 次，频次低，不担心配额。
// - 返回 null 表示「没识别出来」，调用方应回退到手填。
//   null 的来源：无 key / base64 转换失败 / HTTP 错 / 模型返回 "unknown" / 返回值不是合理 kg。
// - 用 AbortController 支持取消（用户在识别中切换照片时打断旧请求）。
//
// 上线前同样需要切到 Cloudflare Worker 代理（key 不进客户端）。详见 docs/dev-log.md。

const KEY = process.env.EXPO_PUBLIC_GEMINI_KEY ?? "";
const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const PROMPT = `这是一张体重秤的照片。读取秤面上显示的体重数字（单位 kg），只输出一个数字（保留一位小数），不要单位，不要任何其他文字。
- 如果秤面模糊、看不清、或这张照片明显不是体重秤，输出 unknown。
- 数字范围应在 20–250 之间，超出范围也输出 unknown。
示例输出：60.5`;

// RN 端把 file:// URI 读成 base64 + mime。用 fetch+FileReader，自包含不引入新依赖。
async function uriToBase64(
  uri: string
): Promise<{ base64: string; mime: string }> {
  const resp = await fetch(uri);
  const blob = await resp.blob();
  const mime = blob.type || "image/jpeg";
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const r = reader.result;
      if (typeof r !== "string") {
        reject(new Error("FileReader: result not a string"));
        return;
      }
      const idx = r.indexOf(",");
      resolve(idx >= 0 ? r.slice(idx + 1) : r);
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
  return { base64, mime };
}

export async function recognizeWeightKg(
  imageUri: string,
  signal?: AbortSignal
): Promise<number | null> {
  if (!KEY) {
    if (__DEV__) console.warn("[weightOcr] no EXPO_PUBLIC_GEMINI_KEY — skip");
    return null;
  }

  let payload: { base64: string; mime: string };
  try {
    payload = await uriToBase64(imageUri);
  } catch (e) {
    if (__DEV__) console.warn("[weightOcr] base64 conversion failed:", String(e));
    return null;
  }

  try {
    const r = await fetch(`${ENDPOINT}?key=${KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: payload.mime, data: payload.base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 20,
        },
      }),
    });
    if (!r.ok) {
      if (__DEV__) {
        const body = await r.text().catch(() => "(no body)");
        console.warn("[weightOcr] HTTP", r.status, body.slice(0, 300));
      }
      return null;
    }
    const j = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      if (__DEV__)
        console.warn(
          "[weightOcr] response missing text:",
          JSON.stringify(j).slice(0, 300)
        );
      return null;
    }
    const cleaned = text.trim().toLowerCase();
    if (cleaned === "unknown" || cleaned === "") return null;
    // 容忍模型偶尔带 "kg" 后缀
    const match = cleaned.match(/-?\d+(\.\d+)?/);
    if (!match) return null;
    const num = parseFloat(match[0]);
    if (isNaN(num) || num < 20 || num > 250) {
      if (__DEV__) console.warn("[weightOcr] out of range:", num);
      return null;
    }
    const rounded = Math.round(num * 10) / 10;
    if (__DEV__) console.log("[weightOcr] ok:", rounded);
    return rounded;
  } catch (e) {
    // AbortError 是正常取消，不当作失败日志
    if (e instanceof DOMException && e.name === "AbortError") return null;
    if (__DEV__) console.warn("[weightOcr] fetch error:", String(e));
    return null;
  }
}

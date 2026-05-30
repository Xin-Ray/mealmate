// 与 mealmate backend (FastAPI) 的 HTTP 客户端。
//
// Base URL 解析顺序：
//   1) EXPO_PUBLIC_API_BASE（首选，新名字）
//   2) EXPO_PUBLIC_DETECT_API_BASE（兼容旧 .env.local，同一台服务器）
//   3) 硬编码 LAN 默认（dev fallback）
//
// 不直接抛 Response，统一封装成 ApiError，message 含 status + body 摘要，
// caller 可按 status 决定降级或重试。

// 默认走公网 Cloudflare Tunnel（自动 HTTPS）；dev 跑本地后端时 .env.local
// 里设 EXPO_PUBLIC_API_BASE=http://<LAN-IP>:8000 覆盖即可
const DEFAULT_BASE = "https://api.flykid.xyz";

export const getApiBase = (): string => {
  const v =
    process.env.EXPO_PUBLIC_API_BASE ?? process.env.EXPO_PUBLIC_DETECT_API_BASE;
  return (v && v.trim()) || DEFAULT_BASE;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: string;
  constructor(status: number, body: string) {
    super(`api ${status}: ${body.slice(0, 200)}`);
    this.status = status;
    this.body = body;
  }
}

type Json = Record<string, unknown> | unknown[] | null;

type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: Json;
  token?: string;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT = 15_000;

export async function apiRequest<T = unknown>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, timeoutMs = DEFAULT_TIMEOUT } = opts;
  const url = `${getApiBase()}${path}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await resp.text();
    if (!resp.ok) throw new ApiError(resp.status, text);
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

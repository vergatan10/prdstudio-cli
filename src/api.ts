import { loadConfig } from "./config.js";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ResolvedConfig {
  baseUrl: string;
  token: string;
}

/**
 * Env vars win over the local config file — lets CI/scripts run without a
 * `login`-written file on disk (PRD section 7.1).
 */
function resolveConfig(): ResolvedConfig {
  const stored = loadConfig();
  const token = process.env.PRDSTUDIO_TOKEN ?? stored?.token;
  const baseUrl = process.env.PRDSTUDIO_URL ?? stored?.baseUrl;

  if (!token || !baseUrl) {
    throw new Error(
      "Belum login. Jalankan `prdstudio login --token <token> --url <baseUrl>`, atau set env var PRDSTUDIO_TOKEN dan PRDSTUDIO_URL."
    );
  }
  return { token, baseUrl };
}

export async function apiRequest<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const { token, baseUrl } = resolveConfig();
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data ? String((data as { error: unknown }).error) : `HTTP ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

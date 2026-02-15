import axios, { AxiosError, AxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.YOUGILE_API_HOST_URL || "https://yougile.com/api-v2";
const API_KEY = process.env.YOUGILE_API_KEY || "";
const CHARACTER_LIMIT = 25000;

export async function yougileRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  data?: Record<string, unknown> | unknown[],
  params?: Record<string, string | number | boolean>
): Promise<T> {
  const url = `${API_BASE_URL}/${path}`;
  const config: AxiosRequestConfig = {
    method,
    url,
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  };
  if (method !== "GET" && data) config.data = data;
  if (params) config.params = params;

  const response = await axios(config);
  return response.data;
}

export function handleError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const s = error.response.status;
      const body = error.response.data;
      if (s === 401) return "Error: Not authorized. Check your YOUGILE_API_KEY.";
      if (s === 403) return "Error: Access denied. Your user lacks permissions for this resource.";
      if (s === 404) return "Error: Resource not found. Check the ID.";
      if (s === 429) return "Error: Rate limit exceeded (50 req/min per company). Wait and retry.";
      return `Error: API returned ${s}. ${JSON.stringify(body)}`;
    }
    if (error.code === "ECONNABORTED") return "Error: Request timed out. Try again.";
    return `Error: Network error — ${error.message}`;
  }
  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}

export function truncate(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return text.slice(0, CHARACTER_LIMIT) + "\n\n--- TRUNCATED (response too large, use limit/offset to paginate) ---";
}

export function ok(text: string) {
  return { content: [{ type: "text" as const, text: truncate(text) }] };
}

export function err(error: unknown) {
  return { isError: true, content: [{ type: "text" as const, text: handleError(error) }] };
}

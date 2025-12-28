import { clearAuth } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  requestId?: string;

  constructor(status: number, message: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
  }
}

type FetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  auth?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://atmosfera-api.onrender.com/api";

let accessToken: string | null = null;

if (typeof window !== "undefined") {
  accessToken = localStorage.getItem("accessToken");
}

const syncTokens = () => {
  if (typeof window === "undefined") return;
  accessToken = localStorage.getItem("accessToken");
};

const setTokens = (access?: string) => {
  if (typeof window === "undefined") return;
  if (access) {
    accessToken = access;
    localStorage.setItem("accessToken", access);
  }
};

const clearTokens = () => {
  if (typeof window === "undefined") return;
  accessToken = null;
  clearAuth();
};

const createRequestId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

async function refreshTokens() {
  syncTokens();
  const requestId = createRequestId();
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-request-id": requestId },
    credentials: "include",
    body: JSON.stringify({})
  });
  if (!res.ok) {
    clearTokens();
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (!path.startsWith("/auth")) {
        window.location.assign("/auth/login");
      }
    }
    const contentType = res.headers.get("content-type") || "";
    let message = "Refresh failed";
    let errorRequestId: string | undefined;
    if (contentType.includes("application/json")) {
      const payload = await res.json().catch(() => null);
      message = payload?.message || payload?.error || message;
      errorRequestId = payload?.requestId;
    } else {
      const text = await res.text();
      message = text || message;
    }
    throw new ApiError(res.status, message, errorRequestId);
  }
  const data = await res.json();
  setTokens(data.accessToken);
  return data.accessToken;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  syncTokens();
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const requestId = createRequestId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-request-id": requestId,
    ...(options.headers || {})
  };
  if (options.auth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const doRequest = async (token?: string) => {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
      credentials: "include",
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (res.status === 401 && options.auth) {
      const newAccess = await refreshTokens();
      return doRequest(newAccess);
    }
    if (!res.ok) {
      const contentType = res.headers.get("content-type") || "";
      let message = res.statusText;
      let errorRequestId: string | undefined = res.headers.get("x-request-id") || undefined;
      if (contentType.includes("application/json")) {
        const payload = await res.json().catch(() => null);
        message = payload?.message || payload?.error || message;
        errorRequestId = payload?.requestId || errorRequestId;
      } else {
        const text = await res.text();
        message = text || message;
      }
      throw new ApiError(res.status, message, errorRequestId);
    }
    if (res.status === 204) return null as any;
    return res.json();
  };
  return doRequest();
}

export function getTokens() {
  return { accessToken };
}

export async function logoutClient() {
  if (typeof window === "undefined") return;
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({})
    });
  } catch {
    // ignore network errors on logout
  }
  clearTokens();
}

type FetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  auth?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

let accessToken: string | null = null;
let refreshToken: string | null = null;

if (typeof window !== "undefined") {
  accessToken = localStorage.getItem("accessToken");
  refreshToken = localStorage.getItem("refreshToken");
}

const setTokens = (access?: string, refresh?: string) => {
  if (typeof window === "undefined") return;
  if (access) {
    accessToken = access;
    localStorage.setItem("accessToken", access);
  }
  if (refresh) {
    refreshToken = refresh;
    localStorage.setItem("refreshToken", refresh);
  }
};

const clearTokens = () => {
  if (typeof window === "undefined") return;
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
};

async function refreshTokens() {
  if (!refreshToken) throw new Error("No refresh token");
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
  if (!res.ok) {
    clearTokens();
    throw new Error("Refresh failed");
  }
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (options.auth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const doRequest = async (token?: string) => {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (res.status === 401 && options.auth && refreshToken) {
      const newAccess = await refreshTokens();
      return doRequest(newAccess);
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    if (res.status === 204) return null as any;
    return res.json();
  };
  return doRequest();
}

export function getTokens() {
  return { accessToken, refreshToken };
}

export function logoutClient() {
  clearTokens();
}

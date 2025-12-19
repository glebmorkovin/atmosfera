export type UserRole = "PLAYER" | "PARENT" | "SCOUT" | "AGENT" | "ADMIN" | "CLUB";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const ROLE_KEY = "userRole";

export const saveTokens = (access?: string, refresh?: string) => {
  if (typeof window === "undefined") return;
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};

export const saveRole = (role?: string) => {
  if (typeof window === "undefined" || !role) return;
  localStorage.setItem(ROLE_KEY, role.toUpperCase());
};

export const getStoredRole = (): UserRole | null => {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(ROLE_KEY);
  return role ? (role as UserRole) : null;
};

export const clearAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(ROLE_KEY);
};

export const roleHome = (role?: string) => {
  const upper = role?.toUpperCase();
  if (upper === "ADMIN") return "/admin";
  if (upper === "SCOUT" || upper === "AGENT" || upper === "CLUB") return "/scout";
  return "/player/dashboard";
};

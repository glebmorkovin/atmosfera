export type UserRole = "PLAYER" | "PARENT" | "SCOUT" | "CLUB" | "ADMIN";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const ROLE_KEY = "userRole";
const ROLE_COOKIE = "userRole";

const setRoleCookie = (role?: string) => {
  if (typeof document === "undefined" || !role) return;
  document.cookie = `${ROLE_COOKIE}=${role.toUpperCase()}; path=/; max-age=2592000; samesite=lax`;
};

const clearRoleCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0; samesite=lax`;
};

export const saveTokens = (access?: string, refresh?: string) => {
  if (typeof window === "undefined") return;
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};

export const saveRole = (role?: string) => {
  if (typeof window === "undefined" || !role) return;
  localStorage.setItem(ROLE_KEY, role.toUpperCase());
  setRoleCookie(role);
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
  clearRoleCookie();
};

export const roleHome = (role?: string) => {
  const upper = role?.toUpperCase();
  if (upper === "ADMIN") return "/admin/dashboard";
  if (upper === "SCOUT") return "/app/scout/dashboard";
  if (upper === "CLUB") return "/app/club/dashboard";
  if (upper === "PARENT") return "/app/parent/dashboard";
  return "/app/player/dashboard";
};

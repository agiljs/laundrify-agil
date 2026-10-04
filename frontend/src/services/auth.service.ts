import api from "./api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  status: "ACTIVE" | "INACTIVE";
  customerId?: string | null;
  customerCode?: string | null;
};

type AuthResponse = { success: boolean; data: { token: string; user: AuthUser } };
type MeResponse = { success: boolean; data: AuthUser };

export async function login(email: string, password: string) {
  const response = await api.post<AuthResponse>("/auth/login", { email, password });
  const { token, user } = response.data.data;
  localStorage.setItem("laundrify_token", token);
  localStorage.setItem("laundrify_user", JSON.stringify(user));
  return user;
}

export async function loginWithGoogle(credential: string) {
  const response = await api.post<AuthResponse>("/auth/google", { credential });
  const { token, user } = response.data.data;
  localStorage.setItem("laundrify_token", token);
  localStorage.setItem("laundrify_user", JSON.stringify(user));
  return user;
}

export async function getMe() {
  const response = await api.get<MeResponse>("/auth/me");
  return response.data.data;
}

export function logout() {
  localStorage.removeItem("laundrify_token");
  localStorage.removeItem("laundrify_user");
}

export function getStoredUser() {
  const value = localStorage.getItem("laundrify_user");
  if (!value) return null;
  try { return JSON.parse(value) as AuthUser; }
  catch { localStorage.removeItem("laundrify_user"); return null; }
}

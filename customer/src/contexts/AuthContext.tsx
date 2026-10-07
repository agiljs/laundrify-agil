import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getMe,
  getStoredUser,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
  type RegisterInput,
} from "../services/auth.service";
import { TOKEN_KEY, USER_KEY } from "../services/storage";
import type { AuthUser } from "../types";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<{ user: AuthUser; linkedExisting: boolean }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setLoading(false);
        return;
      }
      try {
        const current = await getMe();
        setUser(current);
        localStorage.setItem(USER_KEY, JSON.stringify(current));
      } catch {
        logoutApi();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    void restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const current = await loginApi(email, password);
    setUser(current);
    return current;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await registerApi(input);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    logoutApi();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return context;
}

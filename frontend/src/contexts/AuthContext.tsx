import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { disconnectSocket } from "../services/socket";
import { getMe, getStoredUser, login as loginApi, loginWithGoogle as googleLoginApi, logout as logoutApi, type AuthUser } from "../services/auth.service";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  googleLogin: (credential: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("laundrify_token");
      if (!token) { setLoading(false); return; }
      try {
        const currentUser = await getMe();
        setUser(currentUser);
        localStorage.setItem("laundrify_user", JSON.stringify(currentUser));
      } catch {
        logoutApi();
        setUser(null);
      } finally { setLoading(false); }
    }
    void restoreSession();
  }, []);

  async function login(email: string, password: string) {
    const currentUser = await loginApi(email, password);
    setUser(currentUser);
    return currentUser;
  }

  async function googleLogin(credential: string) {
    const currentUser = await googleLoginApi(credential);
    setUser(currentUser);
    return currentUser;
  }

  function logout() { disconnectSocket(); logoutApi(); setUser(null); }

  const value = useMemo(() => ({ user, loading, isAuthenticated: user !== null, login, googleLogin, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return context;
}

import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { api } from "@/api";

export interface AuthUser {
  id: string;
  username: string;
  role: "admin" | "community" | "volunteer";
  communityId?: string;
  volunteerId?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    api.me().then((u) => {
      if (mountedRef.current) setUser(u as AuthUser | null);
    }).finally(() => {
      if (mountedRef.current) setLoading(false);
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(username: string, password: string) {
      const u = await api.login(username, password);
      setUser(u as AuthUser);
    },
    async logout() {
      await api.logout();
      setUser(null);
    },
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}



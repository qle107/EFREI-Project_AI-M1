"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "./api";
import { getMe, refreshTokens, setOnUnauthorized } from "./api";

const ACCESS_KEY = "aisca_access_token";
const REFRESH_KEY = "aisca_refresh_token";
const USER_KEY = "aisca_user";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setAuth: (token: string, refreshToken: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const logoutRef = useRef<() => void>(() => {});

  const setAuth = useCallback((accessToken: string, refreshToken: string, u: User) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(accessToken);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    // Full navigation avoids App Router client RSC fetch (often surfaces as "Failed to fetch"
    // on logout when dev server / Turbopack is flaky).
    window.location.assign("/login");
  }, []);

  logoutRef.current = logout;

  const login = async (username: string, password: string) => {
    const { login: apiLogin } = await import("./api");
    const data = await apiLogin(username, password);
    setAuth(data.access_token, data.refresh_token, data.user);
    router.push("/");
  };

  useEffect(() => {
    setOnUnauthorized(() => logoutRef.current());
    return () => setOnUnauthorized(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const t = localStorage.getItem(ACCESS_KEY);
    const r = localStorage.getItem(REFRESH_KEY);
    const u = localStorage.getItem(USER_KEY);

    if (!t) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function validateSession() {
      try {
        const me = await getMe(t);
        if (cancelled) return;
        setToken(t);
        setUser(me);
        if (u) {
          try {
            const parsed = JSON.parse(u) as User;
            if (parsed?.id === me.id) setUser(parsed);
            else setUser(me);
          } catch {
            setUser(me);
          }
        } else {
          setUser(me);
        }
      } catch {
        if (cancelled) return;
        if (r) {
          try {
            const data = await refreshTokens(r);
            if (cancelled) return;
            setAuth(data.access_token, data.refresh_token, data.user);
            setIsLoading(false);
            return;
          } catch {
            /* fall through to clear */
          }
        }
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    validateSession();
    return () => {
      cancelled = true;
    };
  }, [setAuth]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

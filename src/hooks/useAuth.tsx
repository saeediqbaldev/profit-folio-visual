import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface User {
  id: string;
  username: string;
  email: string | null;
  full_name?: string | null;
  role: "admin" | "trader";
  avatar_url?: string | null;
}

let currentUser: User | null = null;
const subscribers = new Set<(user: User | null) => void>();

const notify = (nextUser: User | null) => {
  currentUser = nextUser;
  subscribers.forEach((listener) => listener(nextUser));
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.get<User>("/api/auth/me");
        if (!cancelled) { notify(me); }
      } catch {
        if (!cancelled) notify(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    subscribers.add(setUser);
    return () => { subscribers.delete(setUser); };
  }, []);

  const signIn = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const u = await api.post<User>("/api/auth/login", { username, password });
      notify(u);
      return true;
    } catch {
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    try { await api.post("/api/auth/logout"); } catch { /* ignore */ }
    notify(null);
  }, []);

  return {
    user,
    session: user ? { user } : null,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
};

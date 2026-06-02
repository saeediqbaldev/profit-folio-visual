import { useState, useEffect, useCallback } from "react";

// Hardcoded single admin user. Auth is checked only on the frontend.
const ADMIN_USERNAME = "Saeeddev";
const ADMIN_PASSWORD = "Saeed@@2026&&";
const STORAGE_KEY = "tj-admin-auth";

export interface User {
  id: string;
  username: string;
  email: string;
}

const ADMIN_USER: User = {
  id: "admin",
  username: ADMIN_USERNAME,
  email: "admin@local",
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setUser(ADMIN_USER);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem(STORAGE_KEY, "1");
        setUser(ADMIN_USER);
        return true;
      }
      return false;
    },
    []
  );

  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
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

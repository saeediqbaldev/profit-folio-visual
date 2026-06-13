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
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") {
        currentUser = ADMIN_USER;
        setUser(ADMIN_USER);
        notify(ADMIN_USER);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    subscribers.add(setUser);
    return () => { subscribers.delete(setUser); };
  }, []);

  const signIn = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem(STORAGE_KEY, "1");
        notify(ADMIN_USER);
        return true;
      }
      return false;
    },
    []
  );

  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
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

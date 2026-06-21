import { useState, useCallback } from "react";

const USERS_KEY = "ims_users";
const SESSION_KEY = "ims_session";

interface StoredUser {
  username: string;
  password: string;
}

function getUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default admin account
  const defaults: StoredUser[] = [{ username: "admin", password: "admin123" }];
  localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
  return defaults;
}

export function useAuth() {
  const [user, setUser] = useState<string | null>(() => {
    return sessionStorage.getItem(SESSION_KEY);
  });

  const login = useCallback((username: string, password: string): boolean => {
    const users = getUsers();
    const found = users.find(
      (u) => u.username === username && u.password === password
    );
    if (found) {
      sessionStorage.setItem(SESSION_KEY, username);
      setUser(username);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return { user, isAuthenticated: !!user, login, logout };
}

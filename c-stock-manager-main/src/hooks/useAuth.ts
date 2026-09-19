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
  const [user, setUser] = useState<string>("Sai General Stores");

  const login = useCallback((username: string, _password: string): boolean => {
    sessionStorage.setItem(SESSION_KEY, username);
    setUser(username);
    return true;
  }, []);

  const logout = useCallback(() => {
    // Keep user logged in as default store profile so no login screen blocks access
    sessionStorage.removeItem(SESSION_KEY);
    setUser("Sai General Stores");
  }, []);

  return { user: user || "Sai General Stores", isAuthenticated: true, login, logout };
}


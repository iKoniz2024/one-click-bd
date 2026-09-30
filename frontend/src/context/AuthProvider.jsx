"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "./authContext";
import { getProfile, logoutUser } from "@/services/auth.api";

function useMountEffect(fn) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fn(); }, []);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("oneclick_auth_user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const data = await getProfile();
      const userData = data?.user !== undefined ? data.user : (data?._id ? data : null);
      setUser(userData);
      if (typeof window !== "undefined") {
        if (userData) {
          localStorage.setItem("oneclick_auth_user", JSON.stringify(userData));
        } else {
          localStorage.removeItem("oneclick_auth_user");
        }
      }
      setLoading(false);
      return userData;
    } catch {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("oneclick_auth_user");
      }
      setLoading(false);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("oneclick_auth_user");
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const info = useMemo(() => ({
    user,
    setUser,
    loading,
    fetchUser,
    logout,
  }), [user, loading, fetchUser, logout]);

  return (
    <AuthContext.Provider value={info}>
      {children}
    </AuthContext.Provider>
  );
}

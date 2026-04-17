"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";

interface UseAdminAuthResult {
  verified: boolean;
  isAdmin: boolean;
  verifying: boolean;
  getToken: () => Promise<string | null>;
}

export function useAdminAuth(): UseAdminAuthResult {
  const { user, loading: authLoading, getToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsAdmin(false);
      setVerifying(false);
      return;
    }

    let isCurrent = true;

    async function verify() {
      try {
        // Reuse the token already held by auth-provider — no extra getSession() call.
        const token = await getToken();
        if (!token) {
          if (isCurrent) { setIsAdmin(false); setVerifying(false); }
          return;
        }

        const res = await fetch("/api/admin/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (isCurrent) setIsAdmin(data.isAdmin === true);
      } catch {
        if (isCurrent) setIsAdmin(false);
      } finally {
        if (isCurrent) setVerifying(false);
      }
    }

    verify();
    return () => { isCurrent = false; };
  }, [user, authLoading, getToken]);

  return {
    verified: !verifying,
    isAdmin,
    verifying: verifying || authLoading,
    getToken,
  };
}

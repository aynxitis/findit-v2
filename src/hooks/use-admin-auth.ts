"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";

interface UseAdminAuthResult {
  verified: boolean;
  isAdmin: boolean;
  verifying: boolean;
  getToken: () => Promise<string | null>;
}

export function useAdminAuth(): UseAdminAuthResult {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const supabase = useMemo(() => createClient(), []);

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
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
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
  }, [user, authLoading, supabase]);

  const getToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, [supabase]);

  return {
    verified: !verifying,
    isAdmin,
    verifying: verifying || authLoading,
    getToken,
  };
}

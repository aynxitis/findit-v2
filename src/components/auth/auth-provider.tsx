"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { User } from "@/lib/types/item";

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthContextValue {
  user: SupabaseAuthUser | null;
  userDoc: User | null;
  loading: boolean;
  signingIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  error: AuthError | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

const ALLOWED_DOMAIN = "estin.dz";

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseAuthUser | null>(null);
  const [userDoc, setUserDoc] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Fetch user profile from public.users table
  const fetchUserDoc = useCallback(
    async (userId: string) => {
      try {
        const { data, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (fetchError || !data) {
          setUserDoc(null);
          return;
        }

        setUserDoc(data as User);
      } catch {
        setUserDoc(null);
      }
    },
    [supabase]
  );

  // Subscribe to auth state changes
  useEffect(() => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      setLoading(false);
    };

    // Safety net: if getSession() or the network hangs, we don't want the
    // app stuck on the loader forever. After 10s, drop loading and let the
    // AuthGate render the sign-in UI.
    const timeoutId = setTimeout(() => {
      if (!settled) {
        console.warn("Auth session lookup timed out after 10s");
        finish();
      }
    }, 10_000);

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        const authUser = session?.user ?? null;
        setUser(authUser);
        if (authUser) {
          fetchUserDoc(authUser.id);
        }
        finish();
      })
      .catch((err) => {
        console.error("getSession failed:", err);
        finish();
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);

      // Resolve loading immediately — don't block on the profile fetch.
      // fetchUserDoc runs in the background; UI updates when it settles.
      finish();

      if (authUser) {
        fetchUserDoc(authUser.id);
      } else {
        setUserDoc(null);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserDoc]);

  const signIn = useCallback(async () => {
    setError(null);
    setSigningIn(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            hd: ALLOWED_DOMAIN,
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        throw {
          code: "auth/oauth-error",
          message: oauthError.message,
        } as AuthError;
      }
    } catch (err) {
      const authError: AuthError =
        err && typeof err === "object" && "code" in err
          ? (err as AuthError)
          : {
              code: "auth/unknown",
              message:
                err instanceof Error ? err.message : "Sign-in failed",
            };
      setError(authError);
      setSigningIn(false);
      throw authError;
    }
    // Note: signingIn stays true because the page will redirect to Google
  }, [supabase]);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserDoc(null);
    } catch (err) {
      setError({
        code: "auth/signout-failed",
        message:
          err instanceof Error ? err.message : "Sign-out failed",
      });
    }
  }, [supabase]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      userDoc,
      loading,
      signingIn,
      signIn,
      signOut,
      getToken,
      error,
      clearError,
    }),
    [user, userDoc, loading, signingIn, signIn, signOut, getToken, error, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

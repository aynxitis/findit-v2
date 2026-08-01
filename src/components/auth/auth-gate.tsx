"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { GoogleButton } from "./google-button";
import { t } from "@/lib/strings";

interface AuthGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function getGateContent(pathname: string) {
  if (pathname.startsWith("/profile")) {
    return {
      title: t("auth.gate.profile.title"),
      description: t("auth.gate.profile.desc"),
    };
  }
  if (pathname.startsWith("/browse")) {
    return {
      title: t("auth.gate.browse.title"),
      description: t("auth.gate.browse.desc"),
    };
  }
  if (pathname.startsWith("/report")) {
    return {
      title: t("auth.gate.report.title"),
      description: t("auth.gate.report.desc"),
    };
  }
  return {
    title: t("auth.gate.default.title"),
    description: t("auth.gate.default.desc"),
  };
}

export function AuthGate({ children, fallback }: AuthGateProps) {
  const { user, userDoc, loading, signIn, signingIn, error } = useAuth();
  const pathname = usePathname();
  const { title, description } = getGateContent(pathname);

  if (loading) {
    return fallback ?? <AuthGateLoader />;
  }

  if (user && userDoc?.banned) {
    return (
      <div className="auth-gate animate-fade-up">
        <div className="auth-gate-icon">
          <Lock className="w-8 h-8 text-red" />
        </div>
        <h2 className="auth-gate-title font-display text-2xl font-extrabold tracking-tight text-red">
          {t("auth.banned.title")}
        </h2>
        <p className="auth-gate-desc">
          {t("auth.banned.desc")}
        </p>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="auth-gate animate-fade-up">
      <div className="auth-gate-icon">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="auth-gate-title font-display text-2xl font-extrabold tracking-tight">
        {title}
      </h2>
      <p className="auth-gate-desc">{description}</p>
      <div className="auth-gate-action">
        <GoogleButton
          onClick={async () => {
            try {
              await signIn();
            } catch {
              // Error shown below
            }
          }}
          loading={signingIn}
          disabled={signingIn}
          className="auth-gate-btn"
        />
      </div>
      {error && (
        <p className="text-sm text-red text-center animate-fade-up">
          {error.message}
        </p>
      )}
      <p className="auth-gate-note">
        {t("auth.gate.note.prefix")}{" "}<strong>@estin.dz</strong>{" "}{t("auth.gate.note.suffix")}
      </p>
    </div>
  );
}

function AuthGateLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-border" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-t-yellow border-l-transparent border-r-transparent border-b-transparent animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        {t("common.loading")}
      </p>
    </div>
  );
}

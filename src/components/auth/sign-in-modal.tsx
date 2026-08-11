"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GoogleButton } from "./google-button";
import { useAuth } from "@/hooks/use-auth";
import { t } from "@/lib/strings";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const { signIn, signingIn, error, clearError, user } = useAuth();

  useEffect(() => {
    if (user && open) {
      onOpenChange(false);
    }
  }, [user, open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      clearError();
    }
  }, [open, clearError]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch {
      // Error is handled by AuthProvider
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader className="items-center text-center">
          <div className="mb-2">
            <Image
              src="/findit.svg"
              alt={t("nav.logoAlt")}
              width={80}
              height={24}
              className="h-6 w-auto"
              priority
            />
          </div>
          <DialogTitle className="font-display text-2xl font-bold">
            {t("signIn.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("signIn.descriptionA")}{" "}<strong className="text-teal">{t("signIn.descriptionDomain")}</strong>{" "}
            {t("signIn.descriptionB")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <GoogleButton
            onClick={handleSignIn}
            loading={signingIn}
            disabled={signingIn}
          />

          {error && (
            <p className="text-sm text-red text-center animate-fade-up">
              {error.message}
            </p>
          )}

          <p className="text-xs text-center text-muted-foreground">
            {t("authGate.noteBefore")}{" "}<strong>{t("authGate.noteDomain")}</strong>{" "}{t("authGate.noteAfter")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

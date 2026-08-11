"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { toTitleCase } from "@/lib/utils";
import { t } from "@/lib/strings";
import Image from "next/image";

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
}

export function AccountModal({ open, onClose }: AccountModalProps) {
  const { user, signOut } = useAuth();
  const dialogRef = useFocusTrap(open);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open || !user) return null;

  const fullName = user.user_metadata?.full_name || t("account.nameFallback");
  const firstName = toTitleCase(fullName.split(" ")[0] || t("account.nameFallback"));

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t("account.label")} className="relative w-full max-w-sm bg-[var(--background)] border border-[var(--border)] rounded-2xl p-6 animate-fade-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image src="/findit.svg" alt={t("nav.logoAlt")} width={80} height={24} className="h-6 w-auto" />
        </div>

        {/* Welcome */}
        <p className="text-center text-[var(--muted)] mb-6">
          {t("account.welcome.a")} {firstName} {t("account.welcome.b")}
        </p>

        {/* Links */}
        <div className="space-y-2 mb-6">
          <Link
            href="/profile"
            onClick={onClose}
            className="block w-full py-3 px-4 rounded-xl border border-[var(--border)] text-center font-display hover:border-yellow hover:bg-yellow/10 hover:text-yellow hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {t("account.myProfile")}
          </Link>
          <Link
            href="/browse"
            onClick={onClose}
            className="block w-full py-3 px-4 rounded-xl border border-[var(--border)] text-center font-display hover:border-yellow hover:bg-yellow/10 hover:text-yellow hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {t("account.browse")}
          </Link>
          <a
            href="mailto:findit@estin.dz"
            className="block w-full py-3 px-4 rounded-xl border border-[var(--border)] text-center font-display hover:border-yellow hover:bg-yellow/10 hover:text-yellow hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {t("account.reportBug")}
          </a>
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--border)] mb-6" />

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-xl bg-red text-white font-display font-semibold hover:bg-red/90 cursor-pointer"
        >
          {t("account.signOut")}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CATEGORY_LABELS, CATEGORY_ICONS, LOCATION_LABELS } from "@/lib/taxonomy";
import type { Item } from "@/lib/types/item";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";
import { t } from "@/lib/strings";

/** The half of claim_item()'s payload that carries the poster's contact details. */
interface PosterContact {
  poster_email?: string | null;
  poster_name?: string | null;
}

interface ClaimModalProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaimSuccess?: () => void;
}

export function ClaimModal({ item, open, onOpenChange, onClaimSuccess }: ClaimModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [contact, setContact] = useState<PosterContact | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (open) {
      setLoading(false);
      setError(null);
      setSuccess(false);
      setContact(null);
    }
  }, [open, item?.id]);

  if (!item) return null;

  const isFound = item.type === "found";
  const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
  const categoryIcon = CATEGORY_ICONS[item.category] || "📦";
  const locationLabel = LOCATION_LABELS[item.location] || item.location;
  const dateStr = item.date ? formatDate(item.date) : "—";

  const handleConfirm = async () => {
    if (!user || !item) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("claim_item", {
        p_item_id: item.id,
        p_claimer_id: user.id,
        p_claimer_email: user.email || null,
        p_claimer_name: user.user_metadata?.full_name || "An ESTIN student",
      });

      if (rpcError) {
        throw new Error(t("claim.error.rpc"));
      }

      const result = data as { success: boolean; error?: string } & PosterContact;

      if (!result.success) {
        const errorMessages: Record<string, string> = {
          ITEM_NOT_FOUND: t("claim.error.notFound"),
          ALREADY_CLAIMED: t("claim.error.alreadyClaimed"),
          LISTING_EXPIRED: t("claim.error.expired"),
          SELF_CLAIM: t("claim.error.selfClaim"),
          RATE_LIMITED: t("claim.error.rateLimited"),
        };
        throw new Error(errorMessages[result.error || ""] || t("claim.error.generic"));
      }

      setContact({ poster_email: result.poster_email, poster_name: result.poster_name });
      setSuccess(true);
      onClaimSuccess?.();

      // No auto-close: the contact details are only revealed now, and the
      // modal is the only place they appear. Dismissal is the X button.
    } catch (err) {
      setError(err instanceof Error ? err.message : t("claim.error.fallback"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setContact(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sign-in-modal max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="font-display text-xl font-bold">
            {success
              ? t("claim.title.success")
              : isFound
              ? t("claim.title.found")
              : t("claim.title.lost")}
          </DialogTitle>
          <DialogDescription className="text-muted text-sm">
            {success
              ? t("claim.description.success")
              : t("claim.description.pending")}
          </DialogDescription>
        </DialogHeader>

        <div
          className="relative w-full mt-4 rounded-lg overflow-hidden bg-surface border border-border"
          style={{ aspectRatio: "4/3" }}
        >
          {item.photo_signed_url ? (
            <Image
              src={item.photo_signed_url}
              alt={categoryLabel}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 448px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {categoryIcon}
            </div>
          )}
        </div>

        <div className="claim-modal-summary mt-4 p-4 rounded-lg bg-surface border border-border">
          <div className="text-xs uppercase tracking-wide text-muted mb-1">{t("claim.itemInfo")}</div>
          <div className="font-medium">
            {categoryIcon} {categoryLabel} · {locationLabel} · {dateStr} · #{item.ref}
          </div>
          {item.description && (
            <div className="text-sm text-muted mt-1">{item.description}</div>
          )}

          <div className="mt-3">
            <div className="text-xs uppercase tracking-wide text-muted mb-1">{t("claim.posterInfo")}</div>
            <div className="font-medium">
              {contact?.poster_name || item.user_name || t("claim.posterFallback")}
            </div>
            {/* Contact details come from claim_item()'s return value and appear
                only once the claim has actually succeeded. */}
            {success && contact?.poster_email && (
              <a
                href={`mailto:${contact.poster_email}`}
                className="text-sm text-teal hover:underline"
              >
                {contact.poster_email}
              </a>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red/10 border border-red/30 text-red text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading || success}
          className={cn(
            "w-full mt-6 py-3 rounded-full font-display font-bold text-sm transition-all cursor-pointer hover:-translate-y-0.5",
            isFound
              ? "bg-teal text-[#0d0d0d] hover:shadow-lg hover:shadow-teal/30"
              : "bg-red text-white hover:shadow-lg hover:shadow-red/30",
            (loading || success) && "opacity-50 cursor-not-allowed"
          )}
        >
          {success
            ? t("claim.submit.done")
            : loading
            ? t("claim.submit.saving")
            : isFound
            ? t("claim.submit.found")
            : t("claim.submit.lost")}
        </button>
      </DialogContent>
    </Dialog>
  );
}

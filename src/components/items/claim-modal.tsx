"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CATEGORY_LABELS, CATEGORY_ICONS, LOCATION_LABELS } from "@/lib/constants/labels";
import type { Item } from "@/lib/types/item";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";

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
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (open) {
      setLoading(false);
      setError(null);
      setSuccess(false);
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
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
        throw new Error("Failed to claim item. Please try again.");
      }

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        const errorMessages: Record<string, string> = {
          ITEM_NOT_FOUND: "This item no longer exists.",
          ALREADY_CLAIMED: "This item has already been claimed.",
          LISTING_EXPIRED: "This listing has expired and can no longer be claimed.",
          SELF_CLAIM: "You can't claim your own item.",
        };
        throw new Error(errorMessages[result.error || ""] || "Failed to claim item.");
      }

      setSuccess(true);
      onClaimSuccess?.();

      closeTimerRef.current = setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim item");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setError(null);
    setSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sign-in-modal max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="font-display text-xl font-bold">
            {success
              ? "Success!"
              : isFound
              ? "Is this yours?"
              : "Did you find this?"}
          </DialogTitle>
          <DialogDescription className="text-muted text-sm">
            {success
              ? "This item has been marked as resolved. Reach out to coordinate!"
              : "Confirm below to mark this item as resolved."}
          </DialogDescription>
        </DialogHeader>

        <div
          className="relative w-full mt-4 rounded-lg overflow-hidden bg-surface border border-border"
          style={{ aspectRatio: "4/3" }}
        >
          {item.photo_url ? (
            <Image
              src={item.photo_url}
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
          <div className="text-xs uppercase tracking-wide text-muted mb-1">Item info</div>
          <div className="font-medium">
            {categoryIcon} {categoryLabel} · {locationLabel} · {dateStr}
          </div>
          {item.description && (
            <div className="text-sm text-muted mt-1">{item.description}</div>
          )}

          <div className="mt-3">
            <div className="text-xs uppercase tracking-wide text-muted mb-1">Poster info</div>
            <div className="font-medium">{item.user_name || "ESTIN Student"}</div>
            {item.user_email && (
              <a
                href={`mailto:${item.user_email}`}
                className="text-sm text-teal hover:underline"
              >
                {item.user_email}
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
            ? "Done! ✓"
            : loading
            ? "Saving..."
            : isFound
            ? "Yes, this is mine →"
            : "Yes, I found this →"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

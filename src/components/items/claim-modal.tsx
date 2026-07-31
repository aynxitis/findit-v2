"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CATEGORY_LABELS, CATEGORY_ICONS, LOCATION_LABELS } from "@/lib/constants/labels";
import type { Item } from "@/lib/types/item";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";

/**
 * Contact details for the item's poster.
 *
 * These come back from claim_item() and are only ever rendered after a
 * successful claim. The poster's email must not appear anywhere in the modal
 * before the user confirms — that disclosed every poster's address to anyone
 * who merely opened the dialog.
 */
interface PosterContact {
  email: string | null;
  name: string | null;
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
  const [contact, setContact] = useState<PosterContact | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const success = contact !== null;

  useEffect(() => {
    if (open) {
      setLoading(false);
      setError(null);
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
        throw new Error("Failed to claim item. Please try again.");
      }

      const result = data as {
        success: boolean;
        error?: string;
        poster_email?: string | null;
        poster_name?: string | null;
      };

      if (!result.success) {
        const errorMessages: Record<string, string> = {
          ITEM_NOT_FOUND: "This item no longer exists.",
          ALREADY_CLAIMED: "This item has already been claimed.",
          LISTING_EXPIRED: "This listing has expired and can no longer be claimed.",
          SELF_CLAIM: "You can't claim your own item.",
        };
        throw new Error(errorMessages[result.error || ""] || "Failed to claim item.");
      }

      // Contact details are disclosed here and nowhere earlier. The modal no
      // longer auto-closes — the user needs time to read the address.
      setContact({
        email: result.poster_email ?? null,
        name: result.poster_name ?? null,
      });
      onClaimSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim item");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setContact(null);
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
              ? "This item has been marked as resolved. Here's how to reach the poster."
              : "Confirm below to mark this item as resolved. You'll get the poster's contact details straight after."}
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
        </div>

        {contact && (
          <div className="mt-4 p-4 rounded-lg bg-surface border border-teal/40">
            <div className="text-xs uppercase tracking-wide text-muted mb-1">
              Contact the poster
            </div>
            <div className="font-medium">{contact.name || "ESTIN Student"}</div>
            {contact.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-teal hover:underline break-all"
              >
                {contact.email}
              </a>
            ) : (
              <p className="text-sm text-muted">
                No contact address on file. They&apos;ve been notified and can reach you.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red/10 border border-red/30 text-red text-sm">
            {error}
          </div>
        )}

        <button
          onClick={success ? handleClose : handleConfirm}
          disabled={loading}
          className={cn(
            "w-full mt-6 py-3 rounded-full font-display font-bold text-sm transition-all cursor-pointer hover:-translate-y-0.5",
            isFound
              ? "bg-teal text-[#0d0d0d] hover:shadow-lg hover:shadow-teal/30"
              : "bg-red text-white hover:shadow-lg hover:shadow-red/30",
            loading && "opacity-50 cursor-not-allowed"
          )}
        >
          {success
            ? "Done ✓"
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

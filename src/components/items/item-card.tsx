"use client";

import { memo } from "react";
import Image from "next/image";
import { CATEGORY_LABELS, CATEGORY_ICONS, LOCATION_LABELS } from "@/lib/taxonomy";
import type { Item } from "@/lib/types/item";
import { t } from "@/lib/strings";
import { cn } from "@/lib/utils";

const EXPIRY_DAYS = 90;

interface ItemCardProps {
  item: Item;
  currentUserId?: string | null;
  onClaim?: (item: Item) => void;
  index?: number;
}

function isExpired(item: Item): boolean {
  if (!item.created_at) return false;
  return Date.now() - new Date(item.created_at).getTime() > EXPIRY_DAYS * 24 * 60 * 60 * 1000;
}

function ItemCardComponent({ item, currentUserId, onClaim, index = 0 }: ItemCardProps) {
  const expired = isExpired(item);
  const isClaimed = item.status === "claimed";
  const isResolved = item.status === "resolved";
  // Both are terminal: the item is off the board either way, and gets the same
  // dimming. Only the label distinguishes them.
  const isSettled = isClaimed || isResolved;
  const isOwnPost = currentUserId && item.user_id === currentUserId;

  const dateStr = item.date
    ? new Date(item.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    : "\u2014";

  const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
  const categoryIcon = CATEGORY_ICONS[item.category] || "\uD83D\uDCE6";
  const locationLabel = LOCATION_LABELS[item.location] || item.location;

  // Determine badge style
  let badgeClass: string;
  let badgeText: string;
  if (isClaimed) {
    badgeClass = "badge-claimed";
    badgeText = t("itemCard.badge.claimed");
  } else if (isResolved) {
    // Same class as claimed, verbatim. Only the text differs.
    badgeClass = "badge-claimed";
    badgeText = t("itemCard.badge.resolved");
  } else if (expired) {
    badgeClass = "badge-expired";
    badgeText = t("itemCard.badge.expired");
  } else if (item.type === "found") {
    badgeClass = "badge-found";
    badgeText = t("itemCard.badge.found");
  } else {
    badgeClass = "badge-lost";
    badgeText = t("itemCard.badge.lost");
  }

  const canClaim = !isSettled && !isOwnPost && !expired;

  const handleClaimClick = () => {
    if (canClaim && onClaim) {
      onClaim(item);
    }
  };

  return (
    <div
      className={cn(
        "item-card",
        `type-${item.type}`,
        isSettled && "status-claimed"
      )}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Photo or Placeholder */}
      {item.photo_signed_url ? (
        <div className="item-photo-wrapper">
          <Image
            src={item.photo_signed_url}
            alt={categoryLabel}
            fill
            className="item-photo"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="item-photo-placeholder">{categoryIcon}</div>
      )}

      {/* Body */}
      <div className="item-body">
        <div className="item-meta">
          <span className={cn("item-type-badge", badgeClass)}>{badgeText}</span>
          {/* Grouped so item-meta keeps exactly two flex children and its
              justify-between layout is unchanged: badge left, date rightmost. */}
          <div className="flex items-center gap-2">
            <span className="item-date">#{item.ref}</span>
            <span className="item-date">{dateStr}</span>
          </div>
        </div>
        <div className="item-category">
          {categoryIcon} {categoryLabel}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="item-poster">
            {"\uD83D\uDC64"} {isOwnPost ? "You" : (item.user_name || "ESTIN Student")}
          </div>
          <div className="item-location">{"\uD83D\uDCCD"} {locationLabel}</div>
        </div>
        {item.description && (
          <div className="item-desc">{item.description}</div>
        )}
      </div>

      {/* Footer */}
      <div className="item-footer">
        {isClaimed ? (
          <button className="btn-claimed-disabled" disabled>
            {t("itemCard.action.alreadyClaimed")}
          </button>
        ) : isResolved ? (
          <button className="btn-claimed-disabled" disabled>
            {t("itemCard.action.alreadyResolved")}
          </button>
        ) : isOwnPost ? (
          <button className="btn-claimed-disabled" disabled>
            {t("itemCard.action.ownPost")}
          </button>
        ) : expired ? (
          <button className="btn-claimed-disabled" disabled>
            {t("itemCard.action.expired")}
          </button>
        ) : item.type === "found" ? (
          <button className="btn-claim" onClick={handleClaimClick}>
            {t("itemCard.action.claimFound")} {"\u2192"}
          </button>
        ) : (
          <button className="btn-claim btn-claim-lost" onClick={handleClaimClick}>
            {t("itemCard.action.claimLost")} {"\u2192"}
          </button>
        )}
      </div>
    </div>
  );
}

export const ItemCard = memo(ItemCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.item.description === nextProps.item.description &&
    prevProps.item.photo_signed_url === nextProps.item.photo_signed_url &&
    prevProps.item.category === nextProps.item.category &&
    prevProps.item.location === nextProps.item.location &&
    prevProps.item.date === nextProps.item.date &&
    prevProps.item.user_name === nextProps.item.user_name &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.onClaim === nextProps.onClaim &&
    prevProps.index === nextProps.index
  );
});

"use client";

import { memo } from "react";
import Image from "next/image";
import { CATEGORY_LABELS, CATEGORY_ICONS, LOCATION_LABELS } from "@/lib/constants/labels";
import type { Item } from "@/lib/types/item";
import { cn } from "@/lib/utils";

const EXPIRY_DAYS = 30;

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
    badgeText = "Claimed";
  } else if (expired) {
    badgeClass = "badge-expired";
    badgeText = "Expired";
  } else if (item.type === "found") {
    badgeClass = "badge-found";
    badgeText = "Found";
  } else {
    badgeClass = "badge-lost";
    badgeText = "Lost";
  }

  const canClaim = !isClaimed && !isOwnPost && !expired;

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
        isClaimed && "status-claimed"
      )}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Photo or Placeholder */}
      {item.photo_url ? (
        <div className="item-photo-wrapper">
          <Image
            src={item.photo_url}
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
          <span className="item-date">{dateStr}</span>
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
            Already claimed
          </button>
        ) : isOwnPost ? (
          <button className="btn-claimed-disabled" disabled>
            Your post
          </button>
        ) : expired ? (
          <button className="btn-claimed-disabled" disabled>
            Post expired
          </button>
        ) : item.type === "found" ? (
          <button className="btn-claim" onClick={handleClaimClick}>
            This is mine {"\u2192"}
          </button>
        ) : (
          <button className="btn-claim btn-claim-lost" onClick={handleClaimClick}>
            I found this {"\u2192"}
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
    prevProps.item.photo_url === nextProps.item.photo_url &&
    prevProps.item.category === nextProps.item.category &&
    prevProps.item.location === nextProps.item.location &&
    prevProps.item.date === nextProps.item.date &&
    prevProps.item.user_name === nextProps.item.user_name &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.onClaim === nextProps.onClaim &&
    prevProps.index === nextProps.index
  );
});

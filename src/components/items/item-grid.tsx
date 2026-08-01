"use client";

import { ItemCard } from "./item-card";
import type { Item } from "@/lib/types/item";
import Link from "next/link";
import { t } from "@/lib/strings";

interface ItemGridProps {
  items: Item[];
  loading: boolean;
  error: string | null;
  currentUserId?: string | null;
  onClaim?: (item: Item) => void;
  emptyType?: "found" | "lost";
  searchQuery?: string;
}

export function ItemGrid({
  items,
  loading,
  error,
  currentUserId,
  onClaim,
  emptyType = "found",
  searchQuery,
}: ItemGridProps) {
  if (loading) {
    return (
      <div className="items-grid">
        <div className="loading-state">{t("board.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="items-grid">
        <div className="loading-state">{error}. Please refresh.</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="items-grid">
        <div className="empty-state">
          <div className="empty-state-icon">
            {emptyType === "found" ? "\uD83D\uDD0D" : "\uD83D\uDCED"}
          </div>
          <h3>
            {searchQuery
              ? t("board.empty.filtered.title")
              : emptyType === "found"
              ? t("board.empty.found.title")
              : t("board.empty.lost.title")}
          </h3>
          <p>
            {searchQuery
              ? `Nothing matched "${searchQuery}". Try a different keyword or clear your search.`
              : emptyType === "found"
              ? t("board.empty.found.desc")
              : t("board.empty.lost.desc")}
          </p>
          {!searchQuery && (
            <Link
              href={emptyType === "found" ? "/report/found" : "/report/lost"}
              className="btn-primary mt-4"
            >
              {emptyType === "found" ? t("board.empty.found.cta") : t("board.empty.lost.cta")}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="items-grid">
      {items.map((item, index) => (
        <ItemCard
          key={item.id}
          item={item}
          currentUserId={currentUserId}
          onClaim={onClaim}
          index={index}
        />
      ))}
    </div>
  );
}

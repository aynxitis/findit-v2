"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useItems } from "@/hooks/use-items";
import { ProfileHeader, ProfileItemCard } from "@/components/profile";
import { ConfirmModal } from "@/components/ui";
import type { Item, ItemType } from "@/lib/types/item";
import { t } from "@/lib/strings";
import { itemStoragePath, PHOTO_BUCKET } from "@/lib/photos";
import { useItemPhotos } from "@/hooks/use-item-photos";

export default function ProfilePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("success") === "true";

  const { items, loading } = useItems({ userId: user?.id });

  const [type, setType] = useState<ItemType>("found");
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [unclaimingId, setUnclaimingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const { resolve } = useItemPhotos(items);

  // Filter items by type
  const filteredItems = useMemo(() => {
    return items.filter((item) => item.type === type);
  }, [items, type]);

  // Stats
  const stats = useMemo(() => {
    return {
      found: items.filter((i) => i.type === "found").length,
      lost: items.filter((i) => i.type === "lost").length,
      claimed: items.filter((i) => i.status === "claimed").length,
    };
  }, [items]);

  // Resolve item
  const handleResolve = async (item: Item) => {
    setResolvingId(item.id);
    setActionError(null);
    try {
      const { error } = await supabase
        .from("items")
        .update({ status: "claimed" })
        .eq("id", item.id)
        .eq("user_id", user!.id);

      if (error) throw error;
    } catch {
      setActionError(t("profile.error.resolve"));
    } finally {
      setResolvingId(null);
    }
  };

  // Put a claimed item back on the board.
  // Goes through unclaim_item() rather than a direct update: the RPC also
  // deletes the claim row and notifies whoever claimed it.
  const handleUnclaim = async (item: Item) => {
    setUnclaimingId(item.id);
    setActionError(null);
    try {
      const { data, error } = await supabase.rpc("unclaim_item", {
        p_item_id: item.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        const messages: Record<string, string> = {
          ITEM_NOT_FOUND: t("profile.unclaim.notFound"),
          NOT_OWNER: t("profile.unclaim.notOwner"),
          NOT_CLAIMED: t("profile.unclaim.notClaimed"),
        };
        throw new Error(messages[result.error || ""] || t("profile.error.unclaim"));
      }
    } catch (err) {
      setActionError(
        err instanceof Error && err.message
          ? err.message
          : t("profile.error.unclaim")
      );
    } finally {
      setUnclaimingId(null);
    }
  };

  // Delete item (and clean up storage photo if present)
  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    setActionError(null);
    try {
      // Clean up photo from storage if present
      const storagePath = itemStoragePath(deleteItem);
      if (storagePath) {
        await supabase.storage
          .from(PHOTO_BUCKET)
          .remove([storagePath])
          .catch(() => {}); // Don't block delete if storage cleanup fails
      }

      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", deleteItem.id)
        .eq("user_id", user!.id);

      if (error) throw error;
      setDeleteItem(null);
    } catch {
      setActionError(t("profile.error.delete"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-[860px] mx-auto px-6 py-12">
      {/* Success message */}
      {showSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-teal/10 border border-teal text-center">
          <span className="text-teal font-semibold">{t("profile.success")}</span>
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-red/10 border border-red/40 text-center" role="alert">
          <span className="text-red font-semibold">{actionError}</span>
        </div>
      )}

      {/* Back link */}
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 text-white/35 text-sm font-display font-bold mb-10 hover:text-yellow transition-colors cursor-pointer"
      >
        {"\u2190"} {t("common.backToBrowse")}
      </Link>

      {/* Profile header */}
      <ProfileHeader stats={stats} />

      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
        <span className="font-display text-[0.7rem] font-bold tracking-[0.18em] uppercase text-white/40">
          {t("profile.sectionLabel")}
        </span>
        <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-full p-[3px] gap-[2px]">
          <button
            onClick={() => setType("found")}
            className={`px-4 py-1.5 rounded-full font-display text-[0.75rem] font-bold cursor-pointer transition-all whitespace-nowrap ${
              type === "found"
                ? "bg-teal text-black"
                : "bg-transparent text-white/40"
            }`}
          >
            {t("profile.tab.found")}
          </button>
          <button
            onClick={() => setType("lost")}
            className={`px-4 py-1.5 rounded-full font-display text-[0.75rem] font-bold cursor-pointer transition-all whitespace-nowrap ${
              type === "lost"
                ? "bg-red text-white"
                : "bg-transparent text-white/40"
            }`}
          >
            {t("profile.tab.lost")}
          </button>
        </div>
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] bg-[var(--surface)] border border-[var(--border)] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center gap-3">
          <h3 className="font-display text-lg font-extrabold">
            {t("profile.empty.title", { type })}
          </h3>
          <p className="text-sm text-white/35 max-w-[280px] leading-relaxed">
            {t("profile.empty.desc", { type })}
          </p>
          <Link
            href={type === "found" ? "/report/found" : "/report/lost"}
            className={`mt-2 inline-block px-6 py-3 rounded-xl font-display font-semibold cursor-pointer ${
              type === "found" ? "bg-teal text-black" : "bg-red text-white"
            }`}
          >
            {type === "found" ? t("profile.empty.cta.found") : t("profile.empty.cta.lost")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <ProfileItemCard
                item={item}
                photoSrc={resolve(item)}
                onResolve={() => handleResolve(item)}
                onUnclaim={() => handleUnclaim(item)}
                onDelete={() => setDeleteItem(item)}
                resolving={resolvingId === item.id}
                unclaiming={unclaimingId === item.id}
              />
            </div>
          ))}
        </div>
      )}

      {/* Delete modal */}
      <ConfirmModal
        open={!!deleteItem}
        onOpenChange={(open) => { if (!open) setDeleteItem(null); }}
        onConfirm={handleDelete}
        title={t("profile.delete.title")}
        message={t("profile.delete.message")}
        confirmText={t("common.delete")}
        variant="danger"
        loading={deleting}
      />

    </div>
  );
}

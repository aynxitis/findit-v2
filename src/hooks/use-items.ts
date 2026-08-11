"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS, LOCATION_LABELS } from "@/lib/taxonomy";
import type { Item, ItemType } from "@/lib/types/item";

const FETCH_LIMIT = 100;

// Migration 004 revoked the table-level SELECT grant on public.items and
// re-granted readable columns one by one, so `select("*")` now fails outright.
// user_email is deliberately absent: it is unreadable by `authenticated` and
// reaches a claimer only through claim_item()'s return value.
const ITEM_COLUMNS =
  "id, ref, type, category, location, zone, where_left, date, description, photo_url, photo_path, status, user_id, user_name, created_at";

// One hour. Long enough that a browse session never watches an image expire,
// short enough that a URL copied out of devtools dies the same day — which is
// the point, given some of these photos are of student ID cards.
const SIGNED_URL_TTL_SECONDS = 3600;

// Sign every distinct photo_path in one round trip and merge the results onto
// the rows. Called before setItems so cards render already-signed and never
// flash a placeholder.
//
// Falls through silently on error: photo_signed_url stays undefined and the
// card shows its category-icon placeholder. A broken signing call should cost
// the photo, not the board.
async function withSignedPhotos(
  supabase: ReturnType<typeof createClient>,
  rows: Item[]
): Promise<Item[]> {
  const paths = Array.from(
    new Set(rows.map((r) => r.photo_path).filter((p): p is string => !!p))
  );
  if (paths.length === 0) return rows;

  const { data, error } = await supabase.storage
    .from("item-photos")
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return rows;

  const signed = new Map<string, string>();
  for (const entry of data) {
    // Per-path errors are reported inside the array, not thrown. A missing
    // object leaves that one row unsigned rather than failing the page.
    if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
  }

  return rows.map((row) =>
    row.photo_path
      ? { ...row, photo_signed_url: signed.get(row.photo_path) }
      : row
  );
}

export interface UseItemsOptions {
  type?: ItemType;
  category?: string | null;
  location?: string | null;
  searchQuery?: string;
  userId?: string | null;
}

export interface UseItemsResult {
  items: Item[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useItems(options: UseItemsOptions = {}): UseItemsResult {
  const { type = "found", category, location, searchQuery, userId } = options;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const supabase = useMemo(() => createClient(), []);

  const retry = useCallback(() => {
    setRetryCount((n) => n + 1);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    async function fetchItems() {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from("items")
          .select(ITEM_COLUMNS)
          .order("created_at", { ascending: false })
          .limit(FETCH_LIMIT);

        if (userId) {
          query = query.eq("user_id", userId);
        } else {
          query = query.eq("type", type);
        }

        if (category) {
          query = query.eq("category", category);
        }
        if (location) {
          query = query.eq("location", location);
        }

        const { data, error: fetchError } = await query;

        if (!isCurrent) return;

        if (fetchError) {
          setError("Failed to load items");
          setLoading(false);
          return;
        }

        const signed = await withSignedPhotos(supabase, (data as Item[]) || []);
        if (!isCurrent) return;

        setItems(signed);
        setLoading(false);
      } catch {
        if (isCurrent) {
          setError("Failed to connect to database");
          setLoading(false);
        }
      }
    }

    fetchItems();

    // Subscribe to realtime changes on items table
    const channel = supabase
      .channel(`items-${type}-${userId || "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
        },
        async (payload) => {
          if (!isCurrent) return;

          if (payload.eventType === "INSERT") {
            const newItem = payload.new as Item;
            // Only add if it matches our current filters
            const matchesType = userId ? true : newItem.type === type;
            const matchesUser = userId ? newItem.user_id === userId : true;
            const matchesCategory = category ? newItem.category === category : true;
            const matchesLocation = location ? newItem.location === location : true;

            if (matchesType && matchesUser && matchesCategory && matchesLocation) {
              // Realtime delivers the row, not a signed URL, so a photo posted
              // while the board is open needs signing like a fetched one.
              const [signedItem] = await withSignedPhotos(supabase, [newItem]);
              if (!isCurrent) return;
              setItems((prev) => [signedItem, ...prev].slice(0, FETCH_LIMIT));
            }
          } else if (payload.eventType === "UPDATE") {
            const [updated] = await withSignedPhotos(supabase, [
              payload.new as Item,
            ]);
            if (!isCurrent) return;
            setItems((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setItems((prev) => prev.filter((item) => item.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      isCurrent = false;
      supabase.removeChannel(channel);
    };
  }, [type, category, location, userId, supabase, retryCount]);

  // Client-side search filter
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const normalized = searchQuery.toLowerCase();
    return items.filter((item) => {
      const searchable = [
        // Both forms, because the card renders "#142" and a student may type
        // the hash back. Substring matching means "142" finds it either way.
        String(item.ref),
        `#${item.ref}`,
        item.category,
        CATEGORY_LABELS[item.category] || "",
        item.location,
        LOCATION_LABELS[item.location] || "",
        item.description || "",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [items, searchQuery]);

  return { items: filteredItems, loading, error, retry };
}

// Hook for a single item
export function useItem(itemId: string | null) {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(!!itemId);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!itemId) return;

    let isCurrent = true;

    async function fetchItem() {
      const { data, error: fetchError } = await supabase
        .from("items")
        .select(ITEM_COLUMNS)
        .eq("id", itemId)
        .single();

      if (!isCurrent) return;

      if (fetchError || !data) {
        setError("Item not found");
        setItem(null);
      } else {
        const [signed] = await withSignedPhotos(supabase, [data as Item]);
        if (!isCurrent) return;
        setItem(signed);
      }
      setLoading(false);
    }

    fetchItem();

    // Subscribe to changes on this specific item
    const channel = supabase
      .channel(`item-${itemId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `id=eq.${itemId}`,
        },
        async (payload) => {
          if (!isCurrent) return;
          if (payload.eventType === "UPDATE") {
            const [signed] = await withSignedPhotos(supabase, [
              payload.new as Item,
            ]);
            if (!isCurrent) return;
            setItem(signed);
          } else if (payload.eventType === "DELETE") {
            setItem(null);
            setError("Item was deleted");
          }
        }
      )
      .subscribe();

    return () => {
      isCurrent = false;
      supabase.removeChannel(channel);
    };
  }, [itemId, supabase]);

  return { item, loading, error };
}

"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS, LOCATION_LABELS } from "@/lib/taxonomy";
import { ITEM_SELECT_COLUMNS } from "@/lib/constants/config";
import type { Item, ItemType } from "@/lib/types/item";

const FETCH_LIMIT = 100;

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
          .select(ITEM_SELECT_COLUMNS)
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

        setItems((data as unknown as Item[]) || []);
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
        (payload) => {
          if (!isCurrent) return;

          if (payload.eventType === "INSERT") {
            const newItem = payload.new as Item;
            // Only add if it matches our current filters
            const matchesType = userId ? true : newItem.type === type;
            const matchesUser = userId ? newItem.user_id === userId : true;
            const matchesCategory = category ? newItem.category === category : true;
            const matchesLocation = location ? newItem.location === location : true;

            if (matchesType && matchesUser && matchesCategory && matchesLocation) {
              setItems((prev) => [newItem, ...prev].slice(0, FETCH_LIMIT));
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Item;
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
        .select(ITEM_SELECT_COLUMNS)
        .eq("id", itemId)
        .single();

      if (!isCurrent) return;

      if (fetchError || !data) {
        setError("Item not found");
        setItem(null);
      } else {
        setItem(data as unknown as Item);
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
        (payload) => {
          if (!isCurrent) return;
          if (payload.eventType === "UPDATE") {
            setItem(payload.new as Item);
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

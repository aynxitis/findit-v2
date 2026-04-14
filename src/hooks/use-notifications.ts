"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";
import type { Notification } from "@/lib/types/item";

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAllRead: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const resetForLoggedOut = () => {
      setNotifications([]);
      setLoading(false);
    };

    if (!user) {
      resetForLoggedOut();
      return;
    }

    let isCurrent = true;

    async function fetchNotifications() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("to_uid", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!isCurrent) return;

      if (!error && data) {
        setNotifications(data as Notification[]);
      }
      setLoading(false);
    }

    fetchNotifications();

    // Subscribe to realtime changes
    // Remove any stale channel with the same name first (React StrictMode double-mount)
    const channelName = `notifications-${user.id}`;
    const existing = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`);
    if (existing) supabase.removeChannel(existing);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `to_uid=eq.${user.id}`,
        },
        (payload) => {
          if (!isCurrent) return;
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `to_uid=eq.${user.id}`,
        },
        (payload) => {
          if (!isCurrent) return;
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `to_uid=eq.${user.id}`,
        },
        (payload) => {
          if (!isCurrent) return;
          const deleted = payload.old as { id: string };
          setNotifications((prev) => prev.filter((n) => n.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      isCurrent = false;
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0 || !user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("to_uid", user.id)
        .eq("read", false);

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
      }
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  }, [notifications, user, supabase]);

  return {
    notifications,
    unreadCount,
    loading,
    markAllRead,
  };
}

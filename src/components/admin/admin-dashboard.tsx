"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { CATEGORY_LABELS, CATEGORY_ICONS, LOCATION_LABELS } from "@/lib/taxonomy";
import { formatTimestamp } from "@/lib/utils/format";
import type { Item, User as UserType } from "@/lib/types/item";
import { RefreshCw } from "lucide-react";
import { t } from "@/lib/strings";

interface Stats {
  totalItems: number;
  foundItems: number;
  lostItems: number;
  claimedItems: number;
  totalUsers: number;
}

export function AdminDashboard() {
  const { isAdmin, verifying, getToken } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [activeTab, setActiveTab] = useState<"items" | "users">("items");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("No session token");

      const res = await fetch("/api/admin/data", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const payload = (await res.json()) as { items: Item[]; users: UserType[] };
      const itemsData = payload.items || [];
      const usersData = payload.users || [];

      setItems(itemsData);
      setUsers(usersData);
      setStats({
        totalItems: itemsData.length,
        foundItems: itemsData.filter((i) => i.type === "found").length,
        lostItems: itemsData.filter((i) => i.type === "lost").length,
        claimedItems: itemsData.filter((i) => i.status === "claimed" || i.status === "resolved").length,
        totalUsers: usersData.length,
      });
    } catch {
      setLoadError(t("admin.error.load"));
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  if (verifying) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold text-red mb-4">{t("admin.denied.title")}</h1>
        <p className="text-[var(--muted)]">
          {t("admin.denied.desc")}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-extrabold">Dashboard</h1>
        <button
          onClick={loadData}
          disabled={loading}
          className="font-display flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--border)] hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-all text-sm font-semibold"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {t("admin.refresh")}
        </button>
      </div>

      {loadError && (
        <div className="mb-6 p-4 rounded-xl bg-red/10 border border-red/40" role="alert">
          <p className="text-red font-semibold text-sm">{loadError}</p>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="font-display text-2xl font-bold">{stats.totalItems}</div>
            <div className="text-sm text-[var(--muted)]">{t("admin.stat.total")}</div>
          </div>
          <div className="p-4 rounded-xl bg-teal/10 border border-teal/20">
            <div className="font-display text-2xl font-bold text-teal">{stats.foundItems}</div>
            <div className="text-sm text-[var(--muted)]">{t("admin.stat.found")}</div>
          </div>
          <div className="p-4 rounded-xl bg-red/10 border border-red/20">
            <div className="font-display text-2xl font-bold text-red">{stats.lostItems}</div>
            <div className="text-sm text-[var(--muted)]">{t("admin.stat.lost")}</div>
          </div>
          <div className="p-4 rounded-xl bg-yellow/10 border border-yellow/20">
            <div className="font-display text-2xl font-bold text-yellow">{stats.claimedItems}</div>
            <div className="text-sm text-[var(--muted)]">{t("admin.stat.resolved")}</div>
          </div>
          <div className="p-4 rounded-xl bg-blue/10 border border-blue/20">
            <div className="font-display text-2xl font-bold text-blue">{stats.totalUsers}</div>
            <div className="text-sm text-[var(--muted)]">{t("admin.stat.users")}</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("items")}
          className={`font-display px-4 py-2 rounded-xl font-semibold cursor-pointer transition-all text-sm ${
            activeTab === "items"
              ? "bg-[var(--foreground)] text-[var(--background)]"
              : "bg-[var(--surface)] border border-[var(--border)] hover:-translate-y-0.5"
          }`}
        >
          {t("admin.tab.items", { count: items.length })}
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`font-display px-4 py-2 rounded-xl font-semibold cursor-pointer transition-all text-sm ${
            activeTab === "users"
              ? "bg-[var(--foreground)] text-[var(--background)]"
              : "bg-[var(--surface)] border border-[var(--border)] hover:-translate-y-0.5"
          }`}
        >
          {t("admin.tab.users", { count: users.length })}
        </button>
      </div>

      {activeTab === "items" && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="font-display text-left py-3 px-2 text-xs font-bold uppercase tracking-wide">{t("admin.col.type")}</th>
                <th className="font-display text-left py-3 px-2 text-xs font-bold uppercase tracking-wide">{t("admin.col.category")}</th>
                <th className="font-display text-left py-3 px-2 text-xs font-bold uppercase tracking-wide">{t("admin.col.location")}</th>
                <th className="font-display text-left py-3 px-2 text-xs font-bold uppercase tracking-wide">{t("admin.col.status")}</th>
                <th className="font-display text-left py-3 px-2 text-xs font-bold uppercase tracking-wide">{t("admin.col.user")}</th>
                <th className="font-display text-left py-3 px-2 text-xs font-bold uppercase tracking-wide">{t("admin.col.date")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--surface)]">
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.type === "found" ? "bg-teal/20 text-teal" : "bg-red/20 text-red"}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm">
                    {CATEGORY_ICONS[item.category]} {CATEGORY_LABELS[item.category]}
                  </td>
                  <td className="py-3 px-2 text-sm text-[var(--muted)]">
                    {LOCATION_LABELS[item.location]}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${item.status === "claimed" ? "bg-yellow/20 text-yellow" : "bg-[var(--surface)]"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-[var(--muted)]">{item.user_email}</td>
                  <td className="py-3 px-2 text-sm text-[var(--muted)]">
                    {formatTimestamp(item.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "users" && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="font-display text-left py-3 px-2 text-xs font-bold uppercase tracking-wide">{t("admin.col.name")}</th>
                <th className="font-display text-left py-3 px-2 text-xs font-bold uppercase tracking-wide">{t("admin.col.email")}</th>
                <th className="font-display text-left py-3 px-2 text-xs font-bold uppercase tracking-wide">Status</th>
                <th className="font-display text-left py-3 px-2 text-xs font-bold uppercase tracking-wide">{t("admin.col.joined")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)] hover:bg-[var(--surface)]">
                  <td className="py-3 px-2 text-sm font-medium">{u.name}</td>
                  <td className="py-3 px-2 text-sm text-[var(--muted)]">{u.email}</td>
                  <td className="py-3 px-2">
                    {u.banned ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-red/20 text-red">{t("admin.state.banned")}</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-teal/20 text-teal">{t("admin.state.active")}</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-sm text-[var(--muted)]">
                    {formatTimestamp(u.joined_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

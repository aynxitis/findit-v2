"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import {
  CATEGORIES,
  ZONES,
  WHERE_LEFT,
  locationLabel,
  locationsForZone,
} from "@/lib/taxonomy";
import type { Item, ItemCategory, KnownLocation, ItemZone, ItemWhereLeft } from "@/lib/types/item";

interface ModalFormState {
  type: "found" | "lost";
  category: ItemCategory | "";
  zone: ItemZone | "";
  location: KnownLocation | "";
  where_left: ItemWhereLeft | "";
  date: string;
  description: string;
  photo_url: string;
  status: "open" | "claimed";
  user_id: string;
  user_name: string;
  user_email: string;
}

export interface AdminItemSaveData {
  type: "found" | "lost";
  category: ItemCategory | "";
  zone: ItemZone | null;
  location: KnownLocation | "";
  where_left: ItemWhereLeft | null;
  date: string;
  description: string | null;
  photo_url: string | null;
  status: "open" | "claimed";
  user_id: string;
  user_name: string | null;
  user_email: string | null;
}

interface AdminItemModalProps {
  item: Item | null;
  onSave: (data: AdminItemSaveData) => void;
  onClose: () => void;
  saving: boolean;
  error?: string | null;
}

const today = new Date().toISOString().split("T")[0];

const selectCls =
  "px-3 py-2 rounded-xl bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)] cursor-pointer";

const inputCls =
  "px-3 py-2 rounded-xl bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--foreground)]";

function defaultForm(): ModalFormState {
  return {
    type: "found",
    category: "",
    zone: "",
    location: "",
    where_left: "",
    date: today,
    description: "",
    photo_url: "",
    status: "open",
    user_id: "",
    user_name: "",
    user_email: "",
  };
}

function itemToForm(item: Item): ModalFormState {
  return {
    type: item.type,
    category: item.category ?? "",
    zone: item.zone ?? "",
    location: (item.location ?? "") as KnownLocation | "",
    where_left: item.where_left ?? "",
    date: item.date ?? today,
    description: item.description ?? "",
    photo_url: item.photo_url ?? "",
    status: item.status,
    user_id: item.user_id ?? "",
    user_name: item.user_name ?? "",
    user_email: item.user_email ?? "",
  };
}

export function AdminItemModal({
  item,
  onSave,
  onClose,
  saving,
  error,
}: AdminItemModalProps) {
  const [form, setForm] = useState<ModalFormState>(() =>
    item ? itemToForm(item) : defaultForm()
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const availableLocations = useMemo(() => locationsForZone(form.zone), [form.zone]);

  function set<K extends keyof ModalFormState>(key: K, value: ModalFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTypeChange(type: "found" | "lost") {
    setForm((prev) => ({ ...prev, type, where_left: type === "lost" ? "" : prev.where_left }));
  }

  function handleZoneChange(zone: ItemZone | "") {
    setForm((prev) => ({ ...prev, zone, location: "" as KnownLocation | "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!form.user_id.trim()) { setValidationError("User ID is required"); return; }
    if (!form.category) { setValidationError("Category is required"); return; }
    if (!form.location) { setValidationError("Location is required"); return; }
    if (!form.date) { setValidationError("Date is required"); return; }
    if (form.type === "found" && !form.where_left) {
      setValidationError("Where left is required for found items");
      return;
    }

    onSave({
      type: form.type,
      category: form.category,
      zone: form.zone || null,
      location: form.location,
      where_left: form.type === "found" ? (form.where_left || null) : null,
      date: form.date,
      description: form.description.trim() || null,
      photo_url: form.photo_url.trim() || null,
      status: form.status,
      user_id: form.user_id.trim(),
      user_name: form.user_name.trim() || null,
      user_email: form.user_email.trim() || null,
    });
  }

  const displayError = validationError || error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg bg-[var(--background)] border border-[var(--border)] rounded-2xl p-6 overflow-y-auto max-h-[90vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 className="font-display text-xl font-bold mb-5">
          {item ? "Edit Item" : "Add Item"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Row 1: Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-display text-xs font-bold text-[var(--muted)] uppercase tracking-wide">Type</span>
              <select value={form.type} onChange={(e) => handleTypeChange(e.target.value as "found" | "lost")} className={selectCls}>
                <option value="found">Found</option>
                <option value="lost">Lost</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-display text-xs font-bold text-[var(--muted)] uppercase tracking-wide">Status</span>
              <select value={form.status} onChange={(e) => set("status", e.target.value as "open" | "claimed")} className={selectCls}>
                <option value="open">Open</option>
                <option value="claimed">Claimed</option>
              </select>
            </label>
          </div>

          {/* Row 2: Category + Date */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-display text-xs font-bold text-[var(--muted)] uppercase tracking-wide">Category *</span>
              <select value={form.category} onChange={(e) => set("category", e.target.value as ItemCategory | "")} className={selectCls}>
                <option value="">Select…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-display text-xs font-bold text-[var(--muted)] uppercase tracking-wide">Date *</span>
              <input
                type="date"
                value={form.date}
                max={today}
                onChange={(e) => set("date", e.target.value)}
                className={inputCls}
              />
            </label>
          </div>

          {/* Row 3: Zone + Location */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-display text-xs font-bold text-[var(--muted)] uppercase tracking-wide">Zone</span>
              <select value={form.zone} onChange={(e) => handleZoneChange(e.target.value as ItemZone | "")} className={selectCls}>
                <option value="">Any / Not sure</option>
                {ZONES.map((z) => (
                  <option key={z.slug} value={z.slug}>{z.icon} {z.label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-display text-xs font-bold text-[var(--muted)] uppercase tracking-wide">Location *</span>
              <select value={form.location} onChange={(e) => set("location", e.target.value as KnownLocation | "")} className={selectCls}>
                <option value="">Select…</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>{locationLabel(loc)}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Row 4: Where Left (found only) */}
          {form.type === "found" && (
            <label className="flex flex-col gap-1">
              <span className="font-display text-xs font-bold text-[var(--muted)] uppercase tracking-wide">Where Left *</span>
              <select value={form.where_left} onChange={(e) => set("where_left", e.target.value as ItemWhereLeft | "")} className={selectCls}>
                <option value="">Select…</option>
                {WHERE_LEFT.map((w) => (
                  <option key={w.slug} value={w.slug}>{w.icon} {w.optionLabel}</option>
                ))}
              </select>
            </label>
          )}

          {/* Row 5: Description */}
          <label className="flex flex-col gap-1">
            <span className="font-display text-xs font-bold text-[var(--muted)] uppercase tracking-wide">
              Description <span className="font-normal normal-case">({form.description.length}/400)</span>
            </span>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value.slice(0, 400))}
              rows={3}
              placeholder="Optional description…"
              className={`${inputCls} resize-none`}
            />
          </label>

          {/* Row 6: Photo URL */}
          <label className="flex flex-col gap-1">
            <span className="font-display text-xs font-bold text-[var(--muted)] uppercase tracking-wide">Photo URL</span>
            <input
              type="url"
              value={form.photo_url}
              onChange={(e) => set("photo_url", e.target.value)}
              placeholder="https://…"
              className={inputCls}
            />
          </label>

          {/* Row 7: User ID + User Email */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-display text-xs font-bold text-[var(--muted)] uppercase tracking-wide">User ID *</span>
              <input
                type="text"
                value={form.user_id}
                onChange={(e) => set("user_id", e.target.value)}
                placeholder="Supabase User UUID"
                className={`${inputCls} font-mono`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-display text-xs font-bold text-[var(--muted)] uppercase tracking-wide">User Email</span>
              <input
                type="email"
                value={form.user_email}
                onChange={(e) => set("user_email", e.target.value)}
                placeholder="user@estin.dz"
                className={inputCls}
              />
            </label>
          </div>

          {/* Row 8: User Name */}
          <label className="flex flex-col gap-1">
            <span className="font-display text-xs font-bold text-[var(--muted)] uppercase tracking-wide">User Name</span>
            <input
              type="text"
              value={form.user_name}
              onChange={(e) => set("user_name", e.target.value)}
              placeholder="Display name"
              className={inputCls}
            />
          </label>

          {/* Error */}
          {displayError && (
            <p className="font-display text-sm text-red px-3 py-2 rounded-xl bg-red/10 border border-red/20">
              {displayError}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="font-display flex-1 py-3 rounded-xl border border-[var(--border)] font-semibold hover:bg-[var(--surface)] hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`font-display flex-1 py-3 rounded-xl font-semibold hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-all ${
                item
                  ? "bg-yellow text-[var(--background)]"
                  : "bg-teal text-[var(--background)]"
              }`}
            >
              {saving ? "Saving…" : item ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

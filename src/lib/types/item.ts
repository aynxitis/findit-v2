// The taxonomy unions are derived from src/lib/taxonomy.ts and re-exported
// here so existing importers keep working. Do not redeclare them.
import type {
  ItemCategory,
  ItemZone,
  ItemWhereLeft,
  KnownLocation,
} from "@/lib/taxonomy";

export type { ItemCategory, ItemZone, ItemWhereLeft, KnownLocation };

export type ItemType = "found" | "lost";
// 'claimed' = a claims row exists, i.e. another student claimed it.
// 'resolved' = the poster closed their own listing. Migration 011 keeps these
// apart deliberately; they are not interchangeable.
export type ItemStatus = "open" | "claimed" | "resolved";

export interface Item {
  id: string;
  // Short sequential number a student can say out loud, type into search and
  // quote in a claim. Server-generated (GENERATED ALWAYS as of migration 013),
  // so it exists on every stored row but not on one being created.
  ref: number;
  type: ItemType;
  category: ItemCategory;
  location: string;
  zone?: ItemZone;
  where_left?: ItemWhereLeft;
  description?: string;
  photo_url?: string;
  // Bucket-relative object path, percent-decoded — the raw name the storage API
  // expects. Two live rows carry a literal space, so never re-derive this from
  // photo_url: the encoded form signs to a 404. See migration 010.
  photo_path?: string;
  // Client-derived, NOT a column. useItems signs photo_path after fetching and
  // merges the result here, so render sites stay plain src={...} consumers.
  photo_signed_url?: string;
  date: string;
  status: ItemStatus;
  user_id: string;
  user_name?: string;
  user_email?: string;
  created_at: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
  banned?: boolean;
  joined_at: string | null;
}

export interface Notification {
  id: string;
  to_uid: string;
  item_id?: string;
  item_type?: ItemType;
  category?: string;
  message: string;
  claimer_name?: string;
  claimer_uid?: string;
  claimer_email?: string;
  read: boolean;
  created_at: string;
}

export interface Claim {
  id: string;
  item_id: string;
  item_type: ItemType;
  item_category: ItemCategory;
  claimed_by: string;
  claimed_email: string | null;
  claimed_name: string;
  poster_uid: string | null;
  poster_email: string | null;
  created_at: string;
}

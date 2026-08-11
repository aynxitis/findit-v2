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
export type ItemStatus = "open" | "claimed";

export interface Item {
  id: string;
  type: ItemType;
  category: ItemCategory;
  location: string;
  zone?: ItemZone;
  where_left?: ItemWhereLeft;
  description?: string;
  photo_url?: string;
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
  verified: boolean;
  banned?: boolean;
  bio?: string;
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

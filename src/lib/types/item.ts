// Taxonomy unions are derived from src/lib/taxonomy.ts, which is the single
// source. They are re-exported here so the many existing
// `from "@/lib/types/item"` imports keep working — but they are defined in
// exactly one place now, and adding a category cannot leave them out of sync.
export type {
  ItemType,
  ItemStatus,
  ItemCategory,
  ItemLocation,
  ItemZone,
  ItemWhereLeft,
} from "@/lib/taxonomy";

import type {
  ItemType,
  ItemStatus,
  ItemCategory,
  ItemZone,
  ItemWhereLeft,
} from "@/lib/taxonomy";

export interface Item {
  id: string;
  /** Sequential, human-readable. Backfilled in created_at order by migration 009. */
  ref?: number;
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

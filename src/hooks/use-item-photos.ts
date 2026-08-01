"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { itemStoragePath, signPhotoPaths } from "@/lib/photos";
import type { Item } from "@/lib/types/item";

type PhotoItem = Pick<Item, "photo_path" | "photo_url">;

/**
 * Resolve displayable photo URLs for a list of items.
 *
 * Returns a path → signed-URL map. Call `resolve(item)` to get the URL to
 * render: the signed one when available, otherwise the legacy public
 * `photo_url`.
 *
 * That fallback is what makes this safe to deploy before the bucket is made
 * private (P2-2 step 4). While the bucket is public both paths work; once it
 * flips, only the signed one does, and the fallback stops mattering. Deploying
 * this first is precisely what allows the flip to happen without breaking
 * every image.
 */
export function useItemPhotos(items: PhotoItem[]) {
  const supabase = useMemo(() => createClient(), []);
  const [signed, setSigned] = useState<Record<string, string>>({});

  // Join the paths into a stable primitive so the effect re-runs when the set
  // of photos changes, not on every re-render of a new array identity.
  const paths = useMemo(
    () =>
      items
        .map((item) => itemStoragePath(item))
        .filter((p): p is string => p !== null),
    [items]
  );
  const pathKey = paths.join("|");

  useEffect(() => {
    if (paths.length === 0) {
      setSigned({});
      return;
    }

    let isCurrent = true;
    signPhotoPaths(supabase, paths).then((map) => {
      if (isCurrent) setSigned(map);
    });

    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathKey is the stable identity of `paths`
  }, [pathKey, supabase]);

  function resolve(item: PhotoItem): string | null {
    const path = itemStoragePath(item);
    if (path && signed[path]) return signed[path];
    return item.photo_url ?? null;
  }

  return { resolve };
}

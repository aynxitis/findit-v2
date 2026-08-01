"use client";

import { CATEGORY_LABELS, CATEGORY_ICONS, LOCATION_LABELS } from "@/lib/taxonomy";
import type { ItemType } from "@/lib/types/item";
import { cn } from "@/lib/utils";
import { t } from "@/lib/strings";

interface ItemFiltersProps {
  activeType: ItemType;
  activeCategory: string | null;
  activeLocation: string | null;
  onCategoryChange: (category: string | null) => void;
  onLocationChange: (location: string | null) => void;
  onClearFilters: () => void;
}

export function ItemFilters({
  activeType,
  activeCategory,
  activeLocation,
  onCategoryChange,
  onLocationChange,
  onClearFilters,
}: ItemFiltersProps) {
  const selectedClass = activeType === "found" ? "selected-found" : "selected-lost";

  return (
    <div className="filters">
      {/* Category Chips */}
      <div className="filter-row">
        <span className="filter-label">{t("filters.category")}</span>
        <div className="chip-row">
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <button
              key={value}
              className={cn("chip", activeCategory === value && selectedClass)}
              onClick={() => onCategoryChange(activeCategory === value ? null : value)}
            >
              {CATEGORY_ICONS[value]} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Location Chips */}
      <div className="filter-row">
        <span className="filter-label">{t("filters.location")}</span>
        <div className="chip-row">
          {Object.entries(LOCATION_LABELS).map(([value, label]) => (
            <button
              key={value}
              className={cn("chip", activeLocation === value && selectedClass)}
              onClick={() => onLocationChange(activeLocation === value ? null : value)}
            >
              {getLocationIcon(value)} {label}
            </button>
          ))}
        </div>
        {(activeCategory || activeLocation) && (
          <button className="filter-clear" onClick={onClearFilters}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

function getLocationIcon(location: string): string {
  const icons: Record<string, string> = {
    library: "\uD83D\uDCDA",
    foyer: "\uD83E\uDE91",
    td_halls: "\uD83D\uDEAA",
    tp_halls: "\uD83D\uDD2C",
    restau: "\uD83C\uDF7D\uFE0F",
    res_foyer: "\uD83E\uDE91",
    unknown: "\u2753",
  };
  return icons[location] || "\uD83D\uDCCD";
}

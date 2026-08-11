"use client";
import { t } from "@/lib/strings";

const STRIP_ITEMS = [
  { label: t("home.strip.tagline"), icon: "✦" },
  { label: t("home.strip.brand"), icon: "✦" },
  { label: t("home.strip.year"), icon: "✦" },
  { label: t("home.strip.school"), icon: "✦" },
  { label: t("home.strip.author"), icon: "✦" },
];

export function ScrollingStrip() {
  // Double the items for seamless loop
  const items = [...STRIP_ITEMS, ...STRIP_ITEMS];

  return (
    <div className="strip-wrapper mt-16">
      <div className="strip-track">
        {items.map((item, i) => (
          <span key={i} className="strip-item">
            <span className="strip-dot" />
            {item.label}
            <span className="strip-icon">{item.icon}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

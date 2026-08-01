"use client";

import Link from "next/link";
import { ReportForm } from "@/components/report";
import { t } from "@/lib/strings";

export default function ReportLostPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <Link
          href="/browse"
          className="text-sm text-[var(--muted)] hover:text-yellow mb-4 inline-flex items-center gap-1 transition-colors font-display"
        >
          {"\u2190"} {t("common.backToBrowse")}
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold mt-4">
          {t("report.lost.title.prefix")} <span className="text-red">{t("report.lost.title.accent")}</span> {t("report.lost.title.suffix")}
        </h1>
        <p className="text-[var(--muted)] mt-3">
          {t("report.lost.desc")}
        </p>
      </div>

      {/* Form */}
      <ReportForm type="lost" />
    </div>
  );
}

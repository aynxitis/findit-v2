"use client";

import Link from "next/link";
import { ReportForm } from "@/components/report";
import { t } from "@/lib/strings";

export default function ReportFoundPage() {
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
          {t("report.found.title.prefix")} <span className="text-teal">{t("report.found.title.accent")}</span> {t("report.found.title.suffix")}
        </h1>
        <p className="text-[var(--muted)] mt-3">
          {t("report.found.desc")}
        </p>
      </div>

      {/* Form */}
      <ReportForm type="found" />
    </div>
  );
}

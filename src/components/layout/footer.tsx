import Link from "next/link";
import { t } from "@/lib/strings";

export function Footer() {
  return (
    <footer className="footer">
      <p>{t("footer.made")}</p>
      {/* Stacked and centred below sm, split left/right above it. */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between mt-1">
        <p>© {new Date().getFullYear()} {t("footer.rights")}</p>
        <p>
          <Link href="/privacy" className="footer-link">
            {t("footer.privacy")}
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="footer-link">
            {t("footer.terms")}
          </Link>
        </p>
      </div>
    </footer>
  );
}

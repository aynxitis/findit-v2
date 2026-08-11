import Link from "next/link";
import { t } from "@/lib/strings";

export function Footer() {
  return (
    <footer className="footer">
      <p>
        {t("footer.made")}
        ·{" "}
        <Link href="/privacy" className="footer-link">
          {t("footer.privacy")}
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="footer-link">
          {t("footer.terms")}
        </Link>
      </p>
      <p className="mt-1">© {new Date().getFullYear()} {t("footer.rights")}</p>
    </footer>
  );
}

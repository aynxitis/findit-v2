import Link from "next/link";
import { t } from "@/lib/strings";

export function Footer() {
  return (
    /* Stacked and centred below xl, three across above it.
       The side tracks are minmax(0,1fr) rather than three equal thirds: equal
       sides are what put the middle child on the container's true centre, and
       sizing the middle track to its content drops the width this needs from
       3x the widest string to the sum of all three. justify-between would
       centre the gaps instead, which is off-centre with unequal children. */
    <footer className="footer grid grid-cols-1 items-center gap-4 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <p className="xl:justify-self-start">
        © {new Date().getFullYear()} {t("footer.rights")}
      </p>
      <p className="xl:justify-self-center">{t("footer.made")}</p>
      <p className="xl:justify-self-end">
        <Link href="/privacy" className="footer-link">
          {t("footer.privacy")}
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="footer-link">
          {t("footer.terms")}
        </Link>
      </p>
    </footer>
  );
}

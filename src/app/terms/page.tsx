import { Nav, Footer, BackgroundBlobs } from "@/components/layout";
import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/strings";

export const metadata: Metadata = {
  title: "Terms of Service | FINDit",
  description:
    "Terms and conditions for using FINDit, the campus lost & found platform for ESTIN Bejaia students.",
};

export default function TermsOfService() {
  return (
    <>
      <BackgroundBlobs />
      <Nav minimal />
      <main className="flex-1">
        <article className="relative z-5 max-w-4xl mx-auto px-6 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-display font-bold text-white/50 hover:text-yellow transition-colors mb-8"
          >
            {t("legal.back")}
          </Link>

          <p className="text-sm uppercase tracking-widest text-teal font-semibold mb-2">
            {t("legal.eyebrow")}
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-1">
            {t("terms.title.a")} <span className="text-yellow">{t("terms.title.b")}</span>
          </h1>
          <p className="text-sm text-white/50 mb-8">{t("legal.updated")}</p>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("terms.what.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70">
              {t("terms.what.a")}{" "}
              <strong className="text-white">{t("terms.what.strong")}</strong>{t("terms.what.b")}
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("terms.who.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70 mb-3">
              {t("terms.who.a")}{" "}
              <strong className="text-white">{t("terms.who.strong1")}</strong>{" "}{t("terms.who.b")}{" "}
              <strong className="text-white">{t("terms.who.strong2")}</strong>{" "}{t("terms.who.c")}
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              {t("terms.who.p2")}
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("terms.post.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70 mb-3">
              {t("terms.post.a")}{" "}
              <strong className="text-white">{t("terms.post.strong")}</strong>{" "}{t("terms.post.b")}
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              {t("terms.post.p2")}
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("terms.claim.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70">
              {t("terms.claim.a")}{" "}
              <strong className="text-white">
                {t("terms.claim.strong")}
              </strong>{" "}
              {t("terms.claim.b")}
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("terms.noGuarantee.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70 mb-3">
              {t("terms.noGuarantee.a")}{" "}<strong className="text-white">{t("terms.noGuarantee.strong")}</strong>{t("terms.noGuarantee.b")}
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              {t("terms.noGuarantee.p2")}
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("terms.content.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70 mb-3">
              {t("terms.content.p1")}
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              {t("terms.content.p2a")}{" "}
              <a href="mailto:findit@estin.dz" className="legal-link">
                {t("legal.email")}
              </a>
              .
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("terms.changes.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70">
              {t("terms.changes.body")}
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("legal.contact.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70">
              {t("terms.contact.a")}{" "}
              <a href="mailto:findit@estin.dz" className="legal-link">
                {t("legal.email")}
              </a>{" "}
              {t("legal.contact.or")}{" "}
              <a
                href="https://github.com/aynxitis"
                target="_blank"
                rel="noopener noreferrer"
                className="legal-link"
              >
                {t("legal.github")}
              </a>
              .
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}

import { Nav, Footer, BackgroundBlobs } from "@/components/layout";
import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/strings";

export const metadata: Metadata = {
  title: "Privacy Policy | FINDit",
  description:
    "Learn how FINDit protects your privacy and handles your data as a student-built platform for ESTIN Bejaia.",
};

export default function PrivacyPolicy() {
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
            {t("privacy.title.a")} <span className="text-yellow">{t("privacy.title.b")}</span>
          </h1>
          <p className="text-sm text-white/50 mb-8">{t("legal.updated")}</p>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("privacy.whoWeAre.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70">
              {t("privacy.whoWeAre.a")}{" "}
              <strong className="text-white">{t("privacy.whoWeAre.strong")}</strong>{t("privacy.whoWeAre.b")}
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("privacy.collect.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70 mb-3">
              {t("privacy.collect.intro")}
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              <strong className="text-white">{t("privacy.collect.name.strong")}</strong>{t("privacy.collect.name.rest")}
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              <strong className="text-white">{t("privacy.collect.email.strong")}</strong>{t("privacy.collect.email.rest")}
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              <strong className="text-white">{t("privacy.collect.photo.strong")}</strong>{t("privacy.collect.photo.rest")}
            </p>
            <p className="text-sm leading-relaxed text-white/70 mt-3">
              {t("privacy.collect.outro")}
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("privacy.why.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70 mb-3">
              {t("privacy.why.a")}{" "}<strong className="text-white">{t("privacy.why.strong")}</strong>{" "}{t("privacy.why.b")}
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              {t("privacy.why.p2")}
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("privacy.store.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70">
              {t("privacy.store.a")}{" "}<strong className="text-white">{t("privacy.store.strong")}</strong>{t("privacy.store.b")}
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("privacy.visibility.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70">
              {t("privacy.visibility.your")}{" "}<strong className="text-white">{t("privacy.visibility.name.strong")}</strong>{" "}{t("privacy.visibility.name.b")}
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              {t("privacy.visibility.your")}{" "}<strong className="text-white">{t("privacy.visibility.email.strong")}</strong>{" "}{t("privacy.visibility.email.b")}
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              {t("privacy.visibility.your")}{" "}<strong className="text-white">{t("privacy.visibility.photo.strong")}</strong>{" "}{t("privacy.visibility.photo.b")}
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("privacy.delete.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70">
              {t("privacy.delete.a")}{" "}
              <a href="mailto:findit@estin.dz" className="legal-link">
                {t("legal.email")}
              </a>{" "}
              {t("privacy.delete.b")}{" "}
              <strong className="text-white">{t("privacy.delete.strong")}</strong>{t("privacy.delete.c")}
            </p>
          </section>

          <section className="legal-card mb-4">
            <h2 className="legal-heading">{t("legal.contact.title")}</h2>
            <p className="text-sm leading-relaxed text-white/70">
              {t("privacy.contact.a")}{" "}
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

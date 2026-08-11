import Link from "next/link";
import { Nav, Footer, BackgroundBlobs } from "@/components/layout";
import { t } from "@/lib/strings";

export default function NotFound() {
  return (
    <>
      <BackgroundBlobs />
      <Nav />

      <main className="relative z-5 flex flex-col items-center justify-center text-center min-h-[calc(100vh-120px)] px-6 py-16 gap-6 flex-1">
        {/* 404 code with gradient */}
        <h1 className="not-found-code animate-fade-up">{t("notFound.code")}</h1>

        <div className="not-found-divider animate-fade-up [animation-delay:50ms]" />

        <span className="font-display text-xs font-bold tracking-[0.18em] uppercase text-teal animate-fade-up [animation-delay:50ms]">
          {t("notFound.eyebrow")}
        </span>

        <h2 className="font-display text-[clamp(1.4rem,4vw,2rem)] font-extrabold tracking-[-0.8px] leading-tight max-w-[480px] animate-fade-up [animation-delay:100ms]">
          {t("notFound.heading")}
        </h2>

        <p className="text-[0.95rem] text-muted leading-relaxed max-w-[380px] animate-fade-up [animation-delay:150ms]">
          {t("notFound.body")}
        </p>

        <div className="flex gap-3 flex-wrap justify-center animate-fade-up [animation-delay:200ms]">
          <Link href="/" className="btn-primary">
            {t("notFound.home")}
          </Link>
          <Link href="/browse" className="btn-ghost">
            {t("notFound.browse")}
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Nav, Footer, BackgroundBlobs } from "@/components/layout";
import { t } from "@/lib/strings";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <>
      <BackgroundBlobs />
      <Nav />

      <main className="relative z-5 flex flex-col items-center justify-center text-center min-h-[calc(100vh-120px)] px-6 py-16 gap-6 flex-1">
        <h1 className="not-found-code animate-fade-up">{t("error.code")}</h1>

        <div className="not-found-divider animate-fade-up [animation-delay:50ms]" />

        <span className="font-display text-xs font-bold tracking-[0.18em] uppercase text-red animate-fade-up [animation-delay:50ms]">
          {t("error.eyebrow")}
        </span>

        <h2 className="font-display text-[clamp(1.4rem,4vw,2rem)] font-extrabold tracking-[-0.8px] leading-tight max-w-[480px] animate-fade-up [animation-delay:100ms]">
          {t("error.heading")}
        </h2>

        <p className="text-[0.95rem] text-muted leading-relaxed max-w-[380px] animate-fade-up [animation-delay:150ms]">
          {t("error.body")}
        </p>

        <div className="flex gap-3 flex-wrap justify-center animate-fade-up [animation-delay:200ms]">
          <button onClick={reset} className="btn-primary">
            {t("error.retry")}
          </button>
          <Link href="/" className="btn-ghost">
            {t("error.home")}
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}

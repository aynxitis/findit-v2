"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Catches errors thrown in the root layout (where the route-level
// error.tsx can't render because it relies on the layout). Ships its
// own <html>/<body> and bare-bones styling — no app-level CSS variables
// or components, because those may be what failed.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#0d0d0d",
          color: "#f5f5f5",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <h1
            style={{
              fontSize: "3rem",
              margin: "0 0 1rem",
              fontWeight: 800,
              letterSpacing: "-1px",
            }}
          >
            Something broke.
          </h1>
          <p
            style={{
              opacity: 0.7,
              lineHeight: 1.5,
              margin: "0 0 2rem",
            }}
          >
            FINDit hit an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: 999,
              border: "none",
              background: "#14b8a6",
              color: "#0d0d0d",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

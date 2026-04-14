import type { NextConfig } from "next";

const SUPABASE_HOST = "dfvlcuhrktyhvnfmwnnv.supabase.co";

// Content Security Policy.
// - 'unsafe-inline' and 'unsafe-eval' are required by Next.js runtime/JSON-LD.
// - connect-src includes wss:// for Supabase Realtime.
// - Google accounts is listed for the OAuth popup flow.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' https://${SUPABASE_HOST} https://lh3.googleusercontent.com data: blob:`,
  "font-src 'self' data:",
  `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST} https://accounts.google.com`,
  "frame-src 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: SUPABASE_HOST },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
